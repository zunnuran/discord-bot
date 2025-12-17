import { Client, GatewayIntentBits, Events, ChannelType, type Guild, type TextChannel } from "discord.js";
import * as cron from "node-cron";
import { storage } from "../storage";
import type { NotificationWithRelations } from "@shared/schema";

class DiscordBotService {
  private client: Client;
  private isReady: boolean = false;
  private schedulerTask: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on(Events.ClientReady, async (c) => {
      console.log(`Discord bot logged in as ${c.user.tag}`);
      this.isReady = true;
      await this.syncAllServers();
      this.startScheduler();
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
          memberCount: fullGuild.approximateMemberCount || fullGuild.memberCount,
          isConnected: true,
        });
      } else {
        server = await storage.createServer({
          discordId: fullGuild.id,
          name: fullGuild.name,
          icon: fullGuild.iconURL(),
          memberCount: fullGuild.approximateMemberCount || fullGuild.memberCount,
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
        
        if (channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildAnnouncement) {
          syncedChannelIds.add(channel.id);
          
          const existingChannel = await storage.getChannelByDiscordId(channel.id);
          
          if (existingChannel) {
            await storage.updateChannel(existingChannel.id, {
              name: channel.name,
              type: channel.type === ChannelType.GuildAnnouncement ? "announcement" : "text",
            });
          } else {
            await storage.createChannel({
              discordId: channel.id,
              serverId: serverId,
              name: channel.name,
              type: channel.type === ChannelType.GuildAnnouncement ? "announcement" : "text",
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

      for (const notification of dueNotifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error("Error processing notifications:", error);
    }
  }

  private async sendNotification(notification: NotificationWithRelations): Promise<void> {
    try {
      if (!notification.channel?.discordId) {
        console.warn(`Notification ${notification.id}: Channel data not available, skipping`);
        await this.logNotificationResult(notification.id, "failed", "Channel not found in database");
        return;
      }

      const channel = await this.client.channels.fetch(notification.channel.discordId);
      
      if (!channel || !("send" in channel)) {
        console.warn(`Notification ${notification.id}: Channel not accessible on Discord`);
        await this.logNotificationResult(notification.id, "failed", "Channel not accessible");
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
      const nextScheduled = this.calculateNextScheduled(notification);
      
      if (nextScheduled && (!notification.endDate || nextScheduled <= notification.endDate)) {
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

      console.log(`Sent notification: ${notification.title || notification.id}`);
    } catch (error: any) {
      console.error(`Failed to send notification ${notification.id}:`, error);
      await this.logNotificationResult(notification.id, "failed", error.message);
    }
  }

  private calculateNextScheduled(notification: NotificationWithRelations): Date | null {
    const now = new Date();
    const current = notification.nextScheduled || notification.scheduleDate;
    
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
      
      default:
        return null;
    }
  }

  private async logNotificationResult(
    notificationId: number, 
    status: "success" | "failed", 
    error?: string
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
}

export const discordBot = new DiscordBotService();
