import {
  Client,
  GatewayIntentBits,
  Events,
  ChannelType,
  type Guild,
  type TextChannel,
  type ThreadChannel,
  type Message,
} from "discord.js";
import * as cron from "node-cron";
import { storage } from "../storage";
import type {
  NotificationWithRelations,
  ForwarderWithRelations,
} from "@shared/schema";

class DiscordBotService {
  private client: Client;
  private isReady: boolean = false;
  private schedulerTask: ReturnType<typeof cron.schedule> | null = null;
  private forwarderCache: Map<string, ForwarderWithRelations[]> = new Map();

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on(Events.ClientReady, async (c) => {
      console.log(`Discord bot logged in as ${c.user.tag}`);
      this.isReady = true;
      await this.syncAllServers();
      await this.loadForwarders();
      this.startScheduler();
    });

    this.client.on(Events.MessageCreate, async (message) => {
      await this.handleMessageForwarding(message);
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      console.log(`Bot joined server: ${guild.name}`);
      await this.syncServer(guild);
    });

    this.client.on(Events.GuildDelete, async (guild) => {
      console.log(`Bot removed from server: ${guild.name}`);
      await this.markServerDisconnected(guild.id);
    });

    this.client.on(Events.Error, (error) => {
      console.error("Discord client error:", error);
    });

    this.client.on(Events.Warn, (warning) => {
      console.warn("Discord client warning:", warning);
    });
  }

  async start(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn("DISCORD_BOT_TOKEN not set, Discord bot will not start");
      return;
    }

    try {
      await this.client.login(token);
      console.log("Discord bot starting...");
    } catch (error) {
      console.error("Failed to start Discord bot:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.schedulerTask) {
      this.schedulerTask.stop();
      this.schedulerTask = null;
    }
    if (this.client) {
      this.client.destroy();
    }
    this.isReady = false;
    console.log("Discord bot stopped");
  }

  getStatus(): {
    isOnline: boolean;
    botName: string | null;
    botId: string | null;
    serverCount: number;
  } {
    if (!this.isReady || !this.client.user) {
      return {
        isOnline: false,
        botName: null,
        botId: null,
        serverCount: 0,
      };
    }

    return {
      isOnline: true,
      botName: this.client.user.tag,
      botId: this.client.user.id,
      serverCount: this.client.guilds.cache.size,
    };
  }

  async syncAllServers(): Promise<void> {
    if (!this.isReady) {
      console.log("Bot not ready, skipping sync");
      return;
    }

    console.log("Syncing all servers...");
    const guilds = Array.from(this.client.guilds.cache.values());

    for (const guild of guilds) {
      try {
        await this.syncServer(guild);
      } catch (error) {
        console.error(`Failed to sync server ${guild.name}:`, error);
      }
    }

    console.log(`Synced ${guilds.length} servers`);
  }

  async syncServer(guild: Guild): Promise<void> {
    try {
      const fullGuild = await guild.fetch();

      let server = await storage.getServerByDiscordId(fullGuild.id);

      if (server) {
        server = await storage.updateServer(server.id, {
          name: fullGuild.name,
          icon: fullGuild.iconURL(),
          memberCount:
            fullGuild.approximateMemberCount || fullGuild.memberCount,
          isConnected: true,
        });
      } else {
        server = await storage.createServer({
          discordId: fullGuild.id,
          name: fullGuild.name,
          icon: fullGuild.iconURL(),
          memberCount:
            fullGuild.approximateMemberCount || fullGuild.memberCount,
          isConnected: true,
        });
      }

      if (server) {
        await this.syncChannels(fullGuild, server.id);
      }

      console.log(`Synced server: ${fullGuild.name}`);
    } catch (error) {
      console.error(`Error syncing server ${guild.name}:`, error);
    }
  }

  async syncChannels(guild: Guild, serverId: number): Promise<void> {
    try {
      const channelsCollection = await guild.channels.fetch();
      const channels = Array.from(channelsCollection.values());
      const existingChannels = await storage.getChannelsByServer(serverId);
      const syncedChannelIds = new Set<string>();

      for (const channel of channels) {
        if (!channel) continue;

        if (
          channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement
        ) {
          syncedChannelIds.add(channel.id);

          const existingChannel = await storage.getChannelByDiscordId(
            channel.id,
          );

          if (existingChannel) {
            await storage.updateChannel(existingChannel.id, {
              name: channel.name,
              type:
                channel.type === ChannelType.GuildAnnouncement
                  ? "announcement"
                  : "text",
            });
          } else {
            await storage.createChannel({
              discordId: channel.id,
              serverId: serverId,
              name: channel.name,
              type:
                channel.type === ChannelType.GuildAnnouncement
                  ? "announcement"
                  : "text",
            });
          }
        }
      }

      for (const existingChannel of existingChannels) {
        if (!syncedChannelIds.has(existingChannel.discordId)) {
          await storage.deleteChannel(existingChannel.id);
        }
      }
    } catch (error) {
      console.error(`Error syncing channels for server ${guild.name}:`, error);
    }
  }

  async markServerDisconnected(discordId: string): Promise<void> {
    try {
      const server = await storage.getServerByDiscordId(discordId);
      if (server) {
        await storage.updateServer(server.id, { isConnected: false });
        console.log(`Marked server ${server.name} as disconnected`);
      }
    } catch (error) {
      console.error("Error marking server as disconnected:", error);
    }
  }

  async syncServerById(
    serverId: number,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isReady) {
      return { success: false, message: "Discord bot is not connected" };
    }

    try {
      const server = await storage.getServer(serverId);
      if (!server) {
        return { success: false, message: "Server not found" };
      }

      const guild = this.client.guilds.cache.get(server.discordId);
      if (!guild) {
        return { success: false, message: "Server not accessible by bot" };
      }

      await this.syncServer(guild);
      return { success: true, message: `Synced channels for ${server.name}` };
    } catch (error: any) {
      console.error(`Error syncing server ${serverId}:`, error);
      return { success: false, message: error.message || "Sync failed" };
    }
  }

  private startScheduler(): void {
    if (this.schedulerTask) {
      this.schedulerTask.stop();
    }

    this.schedulerTask = cron.schedule("* * * * *", async () => {
      await this.processNotifications();
    });

    console.log("Notification scheduler started (runs every minute)");
  }

  private async processNotifications(): Promise<void> {
    try {
      const dueNotifications = await storage.getDueNotifications();

      if (dueNotifications.length === 0) return;

      console.log(`Processing ${dueNotifications.length} due notification(s)`);

      const settings = await storage.getBotSettings();
      const workingDays = settings?.workingDays || [1, 2, 3, 4, 5];
      const today = new Date().getDay();

      for (const notification of dueNotifications) {
        if (notification.repeatType === "working_days" && !workingDays.includes(today)) {
          const nextScheduled = this.findNextWorkingDay(new Date(), workingDays);
          if (nextScheduled) {
            const nextWithTime = new Date(nextScheduled);
            const originalTime = notification.scheduleDate;
            nextWithTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
            await storage.updateNotification(notification.id, { nextScheduled: nextWithTime });
          }
          continue;
        }
        await this.sendNotificationWithWorkingDays(notification, workingDays);
      }
    } catch (error) {
      console.error("Error processing notifications:", error);
    }
  }

  private async sendNotificationWithWorkingDays(
    notification: NotificationWithRelations,
    workingDays: number[],
  ): Promise<void> {
    try {
      if (!notification.channel?.discordId) {
        console.warn(
          `Notification ${notification.id}: Channel data not available, skipping`,
        );
        await this.logNotificationResult(
          notification.id,
          "failed",
          "Channel not found in database",
        );
        return;
      }

      const channel = await this.client.channels.fetch(
        notification.channel.discordId,
      );

      if (!channel || !("send" in channel)) {
        console.warn(
          `Notification ${notification.id}: Channel not accessible on Discord`,
        );
        await this.logNotificationResult(
          notification.id,
          "failed",
          "Channel not accessible",
        );
        return;
      }

      const textChannel = channel as TextChannel;

      let messageContent = notification.message;

      if (notification.mentions) {
        messageContent = `@everyone ${messageContent}`;
      }

      await textChannel.send(messageContent);

      await this.logNotificationResult(notification.id, "success");

      const now = new Date();
      const nextScheduled = this.calculateNextScheduledWithWorkingDays(notification, workingDays);

      if (
        nextScheduled &&
        (!notification.endDate || nextScheduled <= notification.endDate)
      ) {
        await storage.updateNotification(notification.id, {
          lastSent: now,
          nextScheduled: nextScheduled,
        });
      } else {
        await storage.updateNotification(notification.id, {
          lastSent: now,
          isActive: false,
          nextScheduled: null,
        });
      }

      console.log(
        `Sent notification: ${notification.title || notification.id}`,
      );
    } catch (error: any) {
      console.error(`Failed to send notification ${notification.id}:`, error);
      await this.logNotificationResult(
        notification.id,
        "failed",
        error.message,
      );
    }
  }

  private calculateNextScheduledWithWorkingDays(
    notification: NotificationWithRelations,
    workingDays: number[],
  ): Date | null {
    const now = new Date();
    const scheduled = notification.nextScheduled || notification.scheduleDate;
    const current = scheduled > now ? scheduled : now;

    switch (notification.repeatType) {
      case "once":
        return null;

      case "daily": {
        const next = new Date(current);
        next.setDate(next.getDate() + 1);
        return next;
      }

      case "weekly": {
        const next = new Date(current);
        next.setDate(next.getDate() + 7);
        return next;
      }

      case "monthly": {
        const next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        return next;
      }

      case "working_days": {
        return this.findNextWorkingDay(current, workingDays);
      }

      default:
        return null;
    }
  }

  private findNextWorkingDay(fromDate: Date, workingDays: number[]): Date {
    const next = new Date(fromDate);
    next.setDate(next.getDate() + 1);
    for (let i = 0; i < 7; i++) {
      if (workingDays.includes(next.getDay())) {
        return next;
      }
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private async logNotificationResult(
    notificationId: number,
    status: "success" | "failed",
    error?: string,
  ): Promise<void> {
    try {
      await storage.createNotificationLog({
        notificationId,
        status,
        error: error || null,
      });
    } catch (err) {
      console.error("Failed to log notification result:", err);
    }
  }

  async sendMessage(channelId: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      console.error("Bot not ready");
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && "send" in channel) {
        await (channel as TextChannel).send(message);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.isReady;
  }

  getGuildCount(): number {
    return this.client.guilds.cache.size;
  }

  // ============ Message Forwarder Methods ============

  async loadForwarders(): Promise<void> {
    try {
      const activeForwarders = await storage.getActiveForwarders();
      this.forwarderCache.clear();

      for (const forwarder of activeForwarders) {
        if (!forwarder.sourceChannel?.discordId) continue;

        // Use Discord channel ID as key, with optional thread suffix
        const channelDiscordId = forwarder.sourceChannel.discordId;
        const key = forwarder.sourceThreadId
          ? `thread:${forwarder.sourceThreadId}`
          : `channel:${channelDiscordId}`;

        const existing = this.forwarderCache.get(key) || [];
        existing.push(forwarder);
        this.forwarderCache.set(key, existing);

        // Also add by channel for non-thread-specific forwarders
        if (!forwarder.sourceThreadId) {
          const channelKey = `channel:${channelDiscordId}`;
          if (!this.forwarderCache.has(channelKey)) {
            this.forwarderCache.set(channelKey, []);
          }
        }
      }

      console.log(`Loaded ${activeForwarders.length} active forwarder(s)`);
      console.log(
        `[Forwarder] Cache keys: ${Array.from(this.forwarderCache.keys()).join(", ")}`,
      );
    } catch (error) {
      console.error("Failed to load forwarders:", error);
    }
  }

  reloadForwarders(): void {
    this.loadForwarders().catch((err) => {
      console.error("Failed to reload forwarders:", err);
    });
  }

  private async handleMessageForwarding(message: Message): Promise<void> {
    // Ignore bot messages (including our own)
    if (message.author.bot) return;

    // Only process guild messages
    if (!message.guild) return;

    // Debug logging
    console.log(
      `[Forwarder] Message received in channel ${message.channel.id} from ${message.author.tag}: "${message.content.substring(0, 50)}..."`,
    );
    console.log(
      `[Forwarder] Cache has ${this.forwarderCache.size} entries: ${Array.from(this.forwarderCache.keys()).join(", ")}`,
    );

    // Get forwarders for this channel/thread
    let forwarders: ForwarderWithRelations[] = [];

    if (message.channel.isThread()) {
      // Check for thread-specific forwarders first
      const threadKey = `thread:${message.channel.id}`;
      forwarders = [...(this.forwarderCache.get(threadKey) || [])];

      // Also check parent channel forwarders (they should also match thread messages)
      if (message.channel.parentId) {
        const parentKey = `channel:${message.channel.parentId}`;
        forwarders = [
          ...forwarders,
          ...(this.forwarderCache.get(parentKey) || []),
        ];
      }
    } else {
      // Regular channel message
      const channelKey = `channel:${message.channel.id}`;
      forwarders = this.forwarderCache.get(channelKey) || [];
    }

    if (forwarders.length === 0) {
      console.log(`[Forwarder] No forwarders found for this channel/thread`);
      return;
    }

    console.log(
      `[Forwarder] Found ${forwarders.length} forwarder(s) for this channel`,
    );
    const messageContent = message.content.toLowerCase();

    for (const forwarder of forwarders) {
      try {
        // Check if message matches any keyword (case-insensitive)
        const matchedKeyword = forwarder.keywords.find((keyword) => {
          const lowerKeyword = keyword.toLowerCase().trim();
          if (forwarder.matchType === "exact") {
            // Exact match - normalize punctuation and check for word match
            // Remove leading/trailing punctuation and check if keyword appears as distinct token
            const normalizedMessage = messageContent
              .replace(/[^\w\s]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const normalizedKeyword = lowerKeyword
              .replace(/[^\w\s]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            const messageTokens = normalizedMessage.split(" ");
            const keywordTokens = normalizedKeyword.split(" ");

            // Check if all keyword tokens appear in sequence in message
            for (
              let i = 0;
              i <= messageTokens.length - keywordTokens.length;
              i++
            ) {
              let match = true;
              for (let j = 0; j < keywordTokens.length; j++) {
                if (messageTokens[i + j] !== keywordTokens[j]) {
                  match = false;
                  break;
                }
              }
              if (match) return true;
            }
            return false;
          }
          // Contains match - keyword appears anywhere in the message
          return messageContent.includes(lowerKeyword);
        });

        if (!matchedKeyword) continue;

        // Forward the message
        await this.forwardMessage(message, forwarder, matchedKeyword);
      } catch (error: any) {
        console.error(
          `Failed to forward message for forwarder ${forwarder.id}:`,
          error,
        );
        await this.logForwarderResult(
          forwarder.id,
          message.content,
          null,
          "failed",
          error.message,
        );
      }
    }
  }

  private async forwardMessage(
    message: Message,
    forwarder: ForwarderWithRelations,
    matchedKeyword: string,
  ): Promise<void> {
    if (!forwarder.destinationChannel?.discordId) {
      throw new Error("Destination channel not found");
    }

    let targetChannel: TextChannel | ThreadChannel;

    if (forwarder.destinationThreadId) {
      // Send to specific thread
      const thread = await this.client.channels.fetch(
        forwarder.destinationThreadId,
      );
      if (!thread || !thread.isThread()) {
        throw new Error("Destination thread not found or not a thread");
      }
      targetChannel = thread;
    } else {
      // Send to channel
      const channel = await this.client.channels.fetch(
        forwarder.destinationChannel.discordId,
      );
      if (!channel || !("send" in channel)) {
        throw new Error("Destination channel not accessible");
      }
      targetChannel = channel as TextChannel;
    }

    // Build forwarded message
    const forwardedContent = [
      `**Forwarded Message**`,
      `-----`,
      message.content,
    ].join("\n");

    await targetChannel.send(forwardedContent);

    // Log success
    await this.logForwarderResult(
      forwarder.id,
      message.content,
      matchedKeyword,
      "success",
    );

    console.log(
      `Forwarded message matching "${matchedKeyword}" to ${targetChannel.name}`,
    );
  }

  private async logForwarderResult(
    forwarderId: number,
    originalMessage: string,
    matchedKeyword: string | null,
    status: "success" | "failed",
    error?: string,
  ): Promise<void> {
    try {
      await storage.createForwarderLog({
        forwarderId,
        originalMessage: originalMessage.substring(0, 500), // Limit message length
        matchedKeyword,
        status,
        error: error || null,
      });
    } catch (err) {
      console.error("Failed to log forwarder result:", err);
    }
  }

  async getThreadsForServer(
    discordServerId: string,
  ): Promise<Array<{ id: string; name: string; parentId: string }>> {
    if (!this.isReady) return [];

    try {
      const guild = await this.client.guilds.fetch(discordServerId);
      if (!guild) return [];

      const activeThreads = await guild.channels.fetchActiveThreads();

      return activeThreads.threads.map((thread) => ({
        id: thread.id,
        name: thread.name,
        parentId: thread.parentId || "",
      }));
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      return [];
    }
  }
}

export const discordBot = new DiscordBotService();
