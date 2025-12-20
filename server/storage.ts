import {
  users,
  discordServers,
  discordChannels,
  notifications,
  notificationLogs,
  botSettings,
  forwarders,
  forwarderLogs,
  type User,
  type InsertUser,
  type DiscordServer,
  type InsertDiscordServer,
  type DiscordChannel,
  type InsertDiscordChannel,
  type Notification,
  type InsertNotification,
  type NotificationLog,
  type InsertNotificationLog,
  type BotSettings,
  type InsertBotSettings,
  type NotificationWithRelations,
  type DiscordServerWithChannels,
  type Forwarder,
  type InsertForwarder,
  type ForwarderLog,
  type InsertForwarderLog,
  type ForwarderWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  validatePassword(user: User, password: string): Promise<boolean>;

  // Discord server operations
  getServers(): Promise<DiscordServer[]>;
  getServer(id: number): Promise<DiscordServer | undefined>;
  getServerByDiscordId(discordId: string): Promise<DiscordServer | undefined>;
  createServer(server: InsertDiscordServer): Promise<DiscordServer>;
  updateServer(id: number, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined>;
  deleteServer(id: number): Promise<boolean>;

  // Discord channel operations
  getChannels(): Promise<DiscordChannel[]>;
  getChannelsByServer(serverId: number): Promise<DiscordChannel[]>;
  getChannel(id: number): Promise<DiscordChannel | undefined>;
  getChannelByDiscordId(discordId: string): Promise<DiscordChannel | undefined>;
  createChannel(channel: InsertDiscordChannel): Promise<DiscordChannel>;
  updateChannel(id: number, channel: Partial<InsertDiscordChannel>): Promise<DiscordChannel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
  deleteChannelsByServer(serverId: number): Promise<boolean>;

  // Notification operations
  getNotifications(userId?: number): Promise<NotificationWithRelations[]>;
  getNotification(id: number): Promise<NotificationWithRelations | undefined>;
  getNotificationsByServer(serverId: number): Promise<NotificationWithRelations[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  getActiveNotifications(): Promise<NotificationWithRelations[]>;
  getDueNotifications(): Promise<NotificationWithRelations[]>;

  // Notification log operations
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(notificationId: number): Promise<NotificationLog[]>;
  getRecentLogs(userId?: number, limit?: number): Promise<NotificationLog[]>;

  // Bot settings operations
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings>;

  // Statistics
  getStats(userId?: number): Promise<{
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  }>;

  // Forwarder operations
  getForwarders(userId?: number): Promise<ForwarderWithRelations[]>;
  getForwarder(id: number): Promise<ForwarderWithRelations | undefined>;
  getActiveForwarders(): Promise<ForwarderWithRelations[]>;
  getForwardersBySourceChannel(channelDiscordId: string): Promise<ForwarderWithRelations[]>;
  createForwarder(forwarder: InsertForwarder): Promise<Forwarder>;
  updateForwarder(id: number, forwarder: Partial<Forwarder>): Promise<Forwarder | undefined>;
  deleteForwarder(id: number): Promise<boolean>;

  // Forwarder log operations
  createForwarderLog(log: InsertForwarderLog): Promise<ForwarderLog>;
  getForwarderLogs(forwarderId: number, limit?: number): Promise<ForwarderLog[]>;

  // Seed default data
  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...userData, updatedAt: new Date() };
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  // Discord server operations
  async getServers(): Promise<DiscordServer[]> {
    return await db.select().from(discordServers).orderBy(discordServers.name);
  }

  async getServer(id: number): Promise<DiscordServer | undefined> {
    const [server] = await db.select().from(discordServers).where(eq(discordServers.id, id));
    return server;
  }

  async getServerByDiscordId(discordId: string): Promise<DiscordServer | undefined> {
    const [server] = await db.select().from(discordServers).where(eq(discordServers.discordId, discordId));
    return server;
  }

  async createServer(server: InsertDiscordServer): Promise<DiscordServer> {
    const [newServer] = await db.insert(discordServers).values(server).returning();
    return newServer;
  }

  async updateServer(id: number, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined> {
    const [updated] = await db
      .update(discordServers)
      .set({ ...server, updatedAt: new Date() })
      .where(eq(discordServers.id, id))
      .returning();
    return updated;
  }

  async deleteServer(id: number): Promise<boolean> {
    // Delete related channels and notifications first
    await db.delete(discordChannels).where(eq(discordChannels.serverId, id));
    const result = await db.delete(discordServers).where(eq(discordServers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Discord channel operations
  async getChannels(): Promise<DiscordChannel[]> {
    return await db.select().from(discordChannels).orderBy(discordChannels.name);
  }

  async getChannelsByServer(serverId: number): Promise<DiscordChannel[]> {
    return await db
      .select()
      .from(discordChannels)
      .where(eq(discordChannels.serverId, serverId))
      .orderBy(discordChannels.name);
  }

  async getChannel(id: number): Promise<DiscordChannel | undefined> {
    const [channel] = await db.select().from(discordChannels).where(eq(discordChannels.id, id));
    return channel;
  }

  async getChannelByDiscordId(discordId: string): Promise<DiscordChannel | undefined> {
    const [channel] = await db.select().from(discordChannels).where(eq(discordChannels.discordId, discordId));
    return channel;
  }

  async createChannel(channel: InsertDiscordChannel): Promise<DiscordChannel> {
    const [newChannel] = await db.insert(discordChannels).values(channel).returning();
    return newChannel;
  }

  async updateChannel(id: number, channel: Partial<InsertDiscordChannel>): Promise<DiscordChannel | undefined> {
    const [updated] = await db
      .update(discordChannels)
      .set({ ...channel, updatedAt: new Date() })
      .where(eq(discordChannels.id, id))
      .returning();
    return updated;
  }

  async deleteChannel(id: number): Promise<boolean> {
    const result = await db.delete(discordChannels).where(eq(discordChannels.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteChannelsByServer(serverId: number): Promise<boolean> {
    const result = await db.delete(discordChannels).where(eq(discordChannels.serverId, serverId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Notification operations
  async getNotifications(userId?: number): Promise<NotificationWithRelations[]> {
    const baseQuery = db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        serverId: notifications.serverId,
        channelId: notifications.channelId,
        title: notifications.title,
        message: notifications.message,
        scheduleDate: notifications.scheduleDate,
        repeatType: notifications.repeatType,
        endDate: notifications.endDate,
        isActive: notifications.isActive,
        timezone: notifications.timezone,
        mentions: notifications.mentions,
        embeds: notifications.embeds,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        lastSent: notifications.lastSent,
        nextScheduled: notifications.nextScheduled,
        server: discordServers,
        channel: discordChannels,
      })
      .from(notifications)
      .leftJoin(discordServers, eq(notifications.serverId, discordServers.id))
      .leftJoin(discordChannels, eq(notifications.channelId, discordChannels.id))
      .orderBy(desc(notifications.createdAt));

    if (userId) {
      return await baseQuery.where(eq(notifications.userId, userId));
    }
    return await baseQuery;
  }

  async getNotification(id: number): Promise<NotificationWithRelations | undefined> {
    const [notification] = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        serverId: notifications.serverId,
        channelId: notifications.channelId,
        title: notifications.title,
        message: notifications.message,
        scheduleDate: notifications.scheduleDate,
        repeatType: notifications.repeatType,
        endDate: notifications.endDate,
        isActive: notifications.isActive,
        timezone: notifications.timezone,
        mentions: notifications.mentions,
        embeds: notifications.embeds,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        lastSent: notifications.lastSent,
        nextScheduled: notifications.nextScheduled,
        server: discordServers,
        channel: discordChannels,
      })
      .from(notifications)
      .leftJoin(discordServers, eq(notifications.serverId, discordServers.id))
      .leftJoin(discordChannels, eq(notifications.channelId, discordChannels.id))
      .where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByServer(serverId: number): Promise<NotificationWithRelations[]> {
    return await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        serverId: notifications.serverId,
        channelId: notifications.channelId,
        title: notifications.title,
        message: notifications.message,
        scheduleDate: notifications.scheduleDate,
        repeatType: notifications.repeatType,
        endDate: notifications.endDate,
        isActive: notifications.isActive,
        timezone: notifications.timezone,
        mentions: notifications.mentions,
        embeds: notifications.embeds,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        lastSent: notifications.lastSent,
        nextScheduled: notifications.nextScheduled,
        server: discordServers,
        channel: discordChannels,
      })
      .from(notifications)
      .leftJoin(discordServers, eq(notifications.serverId, discordServers.id))
      .leftJoin(discordChannels, eq(notifications.channelId, discordChannels.id))
      .where(eq(notifications.serverId, serverId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        nextScheduled: notification.scheduleDate,
      })
      .returning();
    return newNotification;
  }

  async updateNotification(id: number, notification: Partial<Notification>): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ ...notification, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async deleteNotification(id: number): Promise<boolean> {
    // Delete logs first
    await db.delete(notificationLogs).where(eq(notificationLogs.notificationId, id));
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActiveNotifications(): Promise<NotificationWithRelations[]> {
    return await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        serverId: notifications.serverId,
        channelId: notifications.channelId,
        title: notifications.title,
        message: notifications.message,
        scheduleDate: notifications.scheduleDate,
        repeatType: notifications.repeatType,
        endDate: notifications.endDate,
        isActive: notifications.isActive,
        timezone: notifications.timezone,
        mentions: notifications.mentions,
        embeds: notifications.embeds,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        lastSent: notifications.lastSent,
        nextScheduled: notifications.nextScheduled,
        server: discordServers,
        channel: discordChannels,
      })
      .from(notifications)
      .leftJoin(discordServers, eq(notifications.serverId, discordServers.id))
      .leftJoin(discordChannels, eq(notifications.channelId, discordChannels.id))
      .where(eq(notifications.isActive, true));
  }

  async getDueNotifications(): Promise<NotificationWithRelations[]> {
    const now = new Date();
    return await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        serverId: notifications.serverId,
        channelId: notifications.channelId,
        title: notifications.title,
        message: notifications.message,
        scheduleDate: notifications.scheduleDate,
        repeatType: notifications.repeatType,
        endDate: notifications.endDate,
        isActive: notifications.isActive,
        timezone: notifications.timezone,
        mentions: notifications.mentions,
        embeds: notifications.embeds,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        lastSent: notifications.lastSent,
        nextScheduled: notifications.nextScheduled,
        server: discordServers,
        channel: discordChannels,
      })
      .from(notifications)
      .leftJoin(discordServers, eq(notifications.serverId, discordServers.id))
      .leftJoin(discordChannels, eq(notifications.channelId, discordChannels.id))
      .where(
        and(
          eq(notifications.isActive, true),
          sql`${notifications.nextScheduled} <= ${now}`
        )
      );
  }

  // Notification log operations
  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    const [newLog] = await db.insert(notificationLogs).values(log).returning();
    return newLog;
  }

  async getNotificationLogs(notificationId: number): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.notificationId, notificationId))
      .orderBy(desc(notificationLogs.sentAt));
  }

  async getRecentLogs(userId?: number, limit: number = 20): Promise<NotificationLog[]> {
    if (userId) {
      const results = await db
        .select({
          id: notificationLogs.id,
          notificationId: notificationLogs.notificationId,
          sentAt: notificationLogs.sentAt,
          status: notificationLogs.status,
          error: notificationLogs.error,
        })
        .from(notificationLogs)
        .innerJoin(notifications, eq(notificationLogs.notificationId, notifications.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notificationLogs.sentAt))
        .limit(limit);
      return results as NotificationLog[];
    }
    return await db
      .select()
      .from(notificationLogs)
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit);
  }

  // Bot settings operations
  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.id, 1));
    return settings;
  }

  async updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings> {
    const existing = await this.getBotSettings();
    if (existing) {
      const [updated] = await db
        .update(botSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(botSettings.id, 1))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(botSettings)
        .values({ id: 1, ...settings })
        .returning();
      return created;
    }
  }

  // Statistics
  async getStats(userId?: number): Promise<{
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  }> {
    // Get active notifications count
    const activeNotificationsQuery = userId
      ? db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(notifications)
          .where(and(eq(notifications.isActive, true), eq(notifications.userId, userId)))
      : db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(notifications)
          .where(eq(notifications.isActive, true));
    
    const [{ count: activeNotifications }] = await activeNotificationsQuery;

    // Get connected servers count
    const [{ count: connectedServers }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(discordServers)
      .where(eq(discordServers.isConnected, true));

    // Get total messages sent (only count successful ones)
    const [{ count: messagesSent }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notificationLogs)
      .where(eq(notificationLogs.status, "success"));

    // Get success rate
    const [{ count: successfulMessages }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notificationLogs)
      .where(eq(notificationLogs.status, "success"));

    const successRate = messagesSent > 0 ? (successfulMessages / messagesSent) * 100 : 100;

    return {
      activeNotifications,
      connectedServers,
      messagesSent,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  // Forwarder operations
  async getForwarders(userId?: number): Promise<ForwarderWithRelations[]> {
    const sourceServers = db.select().from(discordServers).as("sourceServers");
    const destinationServers = db.select().from(discordServers).as("destinationServers");
    const sourceChannels = db.select().from(discordChannels).as("sourceChannels");
    const destinationChannels = db.select().from(discordChannels).as("destinationChannels");

    const baseQuery = db
      .select({
        id: forwarders.id,
        userId: forwarders.userId,
        name: forwarders.name,
        sourceServerId: forwarders.sourceServerId,
        sourceChannelId: forwarders.sourceChannelId,
        sourceThreadId: forwarders.sourceThreadId,
        destinationServerId: forwarders.destinationServerId,
        destinationChannelId: forwarders.destinationChannelId,
        destinationThreadId: forwarders.destinationThreadId,
        keywords: forwarders.keywords,
        matchType: forwarders.matchType,
        isActive: forwarders.isActive,
        createdAt: forwarders.createdAt,
        updatedAt: forwarders.updatedAt,
      })
      .from(forwarders)
      .orderBy(desc(forwarders.createdAt));

    let results;
    if (userId) {
      results = await baseQuery.where(eq(forwarders.userId, userId));
    } else {
      results = await baseQuery;
    }

    // Fetch relations separately
    const enriched = await Promise.all(
      results.map(async (f) => {
        const [sourceServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.sourceServerId));
        const [sourceChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.sourceChannelId));
        const [destinationServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.destinationServerId));
        const [destinationChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.destinationChannelId));
        
        return {
          ...f,
          sourceServer: sourceServer || null,
          sourceChannel: sourceChannel || null,
          destinationServer: destinationServer || null,
          destinationChannel: destinationChannel || null,
        };
      })
    );

    return enriched;
  }

  async getForwarder(id: number): Promise<ForwarderWithRelations | undefined> {
    const [forwarder] = await db.select().from(forwarders).where(eq(forwarders.id, id));
    if (!forwarder) return undefined;

    const [sourceServer] = await db.select().from(discordServers).where(eq(discordServers.id, forwarder.sourceServerId));
    const [sourceChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, forwarder.sourceChannelId));
    const [destinationServer] = await db.select().from(discordServers).where(eq(discordServers.id, forwarder.destinationServerId));
    const [destinationChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, forwarder.destinationChannelId));

    return {
      ...forwarder,
      sourceServer: sourceServer || null,
      sourceChannel: sourceChannel || null,
      destinationServer: destinationServer || null,
      destinationChannel: destinationChannel || null,
    };
  }

  async getActiveForwarders(): Promise<ForwarderWithRelations[]> {
    const results = await db
      .select()
      .from(forwarders)
      .where(eq(forwarders.isActive, true));

    const enriched = await Promise.all(
      results.map(async (f) => {
        const [sourceServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.sourceServerId));
        const [sourceChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.sourceChannelId));
        const [destinationServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.destinationServerId));
        const [destinationChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.destinationChannelId));
        
        return {
          ...f,
          sourceServer: sourceServer || null,
          sourceChannel: sourceChannel || null,
          destinationServer: destinationServer || null,
          destinationChannel: destinationChannel || null,
        };
      })
    );

    return enriched;
  }

  async getForwardersBySourceChannel(channelDiscordId: string): Promise<ForwarderWithRelations[]> {
    const channel = await this.getChannelByDiscordId(channelDiscordId);
    if (!channel) return [];

    const results = await db
      .select()
      .from(forwarders)
      .where(and(
        eq(forwarders.sourceChannelId, channel.id),
        eq(forwarders.isActive, true)
      ));

    const enriched = await Promise.all(
      results.map(async (f) => {
        const [sourceServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.sourceServerId));
        const [sourceChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.sourceChannelId));
        const [destinationServer] = await db.select().from(discordServers).where(eq(discordServers.id, f.destinationServerId));
        const [destinationChannel] = await db.select().from(discordChannels).where(eq(discordChannels.id, f.destinationChannelId));
        
        return {
          ...f,
          sourceServer: sourceServer || null,
          sourceChannel: sourceChannel || null,
          destinationServer: destinationServer || null,
          destinationChannel: destinationChannel || null,
        };
      })
    );

    return enriched;
  }

  async createForwarder(forwarder: InsertForwarder): Promise<Forwarder> {
    const [newForwarder] = await db
      .insert(forwarders)
      .values(forwarder)
      .returning();
    return newForwarder;
  }

  async updateForwarder(id: number, forwarder: Partial<Forwarder>): Promise<ForwarderWithRelations | undefined> {
    const [updated] = await db
      .update(forwarders)
      .set({ ...forwarder, updatedAt: new Date() })
      .where(eq(forwarders.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Return enriched forwarder with relations
    return this.getForwarder(id);
  }

  async deleteForwarder(id: number): Promise<boolean> {
    // Delete logs first
    await db.delete(forwarderLogs).where(eq(forwarderLogs.forwarderId, id));
    const result = await db.delete(forwarders).where(eq(forwarders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Forwarder log operations
  async createForwarderLog(log: InsertForwarderLog): Promise<ForwarderLog> {
    const [newLog] = await db.insert(forwarderLogs).values(log).returning();
    return newLog;
  }

  async getForwarderLogs(forwarderId: number, limit: number = 20): Promise<ForwarderLog[]> {
    return await db
      .select()
      .from(forwarderLogs)
      .where(eq(forwarderLogs.forwarderId, forwarderId))
      .orderBy(desc(forwarderLogs.forwardedAt))
      .limit(limit);
  }

  // Seed default data
  async seedDefaultData(): Promise<void> {
    // Check if admin user exists
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      await this.createUser({
        username: "admin",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
        isActive: true,
      });
      console.log("Default admin user created: admin / admin123");
    }

    // Ensure bot settings exist
    const existingSettings = await this.getBotSettings();
    if (!existingSettings) {
      await this.updateBotSettings({
        defaultTimezone: "UTC",
        maxMessagesPerMinute: 10,
        enableAnalytics: true,
        autoCleanupDays: 30,
      });
      console.log("Default bot settings created");
    }
  }
}

export const storage = new DatabaseStorage();
