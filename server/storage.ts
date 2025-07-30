import { 
  type User, type InsertUser,
  type DiscordServer, type InsertDiscordServer,
  type DiscordChannel, type InsertDiscordChannel,
  type Notification, type InsertNotification,
  type NotificationLog, type InsertNotificationLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Discord server operations
  getServers(): Promise<DiscordServer[]>;
  getServer(id: string): Promise<DiscordServer | undefined>;
  createServer(server: InsertDiscordServer): Promise<DiscordServer>;
  updateServer(id: string, server: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined>;

  // Discord channel operations
  getChannelsByServer(serverId: string): Promise<DiscordChannel[]>;
  getChannel(id: string): Promise<DiscordChannel | undefined>;
  createChannel(channel: InsertDiscordChannel): Promise<DiscordChannel>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<Notification>): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;
  getActiveNotifications(): Promise<Notification[]>;

  // Notification log operations
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(notificationId: string): Promise<NotificationLog[]>;

  // Statistics
  getStats(userId: string): Promise<{
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private servers: Map<string, DiscordServer> = new Map();
  private channels: Map<string, DiscordChannel> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private notificationLogs: Map<string, NotificationLog> = new Map();

  constructor() {
    // Initialize with some sample data for development
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample servers
    const servers = [
      { id: "server1", name: "Gaming Server", icon: null, memberCount: 1247, isConnected: true },
      { id: "server2", name: "Dev Team", icon: null, memberCount: 23, isConnected: true },
      { id: "server3", name: "Community Hub", icon: null, memberCount: 892, isConnected: true },
    ];
    
    servers.forEach(server => this.servers.set(server.id, server));

    // Sample channels
    const channels = [
      { id: "general", serverId: "server1", name: "general", type: "text" },
      { id: "announcements", serverId: "server1", name: "announcements", type: "text" },
      { id: "events", serverId: "server1", name: "events", type: "text" },
      { id: "dev-general", serverId: "server2", name: "general", type: "text" },
      { id: "dev-announcements", serverId: "server2", name: "announcements", type: "text" },
      { id: "community-general", serverId: "server3", name: "general", type: "text" },
      { id: "community-events", serverId: "server3", name: "events", type: "text" },
    ];
    
    channels.forEach(channel => this.channels.set(channel.id, channel));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      avatar: insertUser.avatar || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getServers(): Promise<DiscordServer[]> {
    return Array.from(this.servers.values());
  }

  async getServer(id: string): Promise<DiscordServer | undefined> {
    return this.servers.get(id);
  }

  async createServer(server: InsertDiscordServer): Promise<DiscordServer> {
    const newServer: DiscordServer = {
      ...server,
      icon: server.icon || null,
      memberCount: server.memberCount || null,
      isConnected: server.isConnected || null,
    };
    this.servers.set(server.id, newServer);
    return newServer;
  }

  async updateServer(id: string, updateData: Partial<InsertDiscordServer>): Promise<DiscordServer | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;
    
    const updatedServer = { ...server, ...updateData };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }

  async getChannelsByServer(serverId: string): Promise<DiscordChannel[]> {
    return Array.from(this.channels.values()).filter(channel => channel.serverId === serverId);
  }

  async getChannel(id: string): Promise<DiscordChannel | undefined> {
    return this.channels.get(id);
  }

  async createChannel(channel: InsertDiscordChannel): Promise<DiscordChannel> {
    this.channels.set(channel.id, channel);
    return channel;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      endDate: insertNotification.endDate || null,
      isActive: insertNotification.isActive || null,
      timezone: insertNotification.timezone || null,
      mentions: insertNotification.mentions || null,
      embeds: insertNotification.embeds || null,
      createdAt: new Date(),
      lastSent: null,
      nextScheduled: insertNotification.scheduleDate,
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(id: string, updateData: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...updateData };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getActiveNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => n.isActive);
  }

  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    const id = randomUUID();
    const notificationLog: NotificationLog = {
      ...log,
      id,
      error: log.error || null,
      sentAt: new Date(),
    };
    this.notificationLogs.set(id, notificationLog);
    return notificationLog;
  }

  async getNotificationLogs(notificationId: string): Promise<NotificationLog[]> {
    return Array.from(this.notificationLogs.values())
      .filter(log => log.notificationId === notificationId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async getStats(userId: string): Promise<{
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  }> {
    const userNotifications = await this.getNotifications(userId);
    const activeNotifications = userNotifications.filter(n => n.isActive).length;
    const connectedServers = Array.from(this.servers.values()).filter(s => s.isConnected).length;
    
    const allLogs = Array.from(this.notificationLogs.values());
    const userNotificationIds = userNotifications.map(n => n.id);
    const userLogs = allLogs.filter(log => userNotificationIds.includes(log.notificationId));
    
    const messagesSent = userLogs.length;
    const successfulMessages = userLogs.filter(log => log.status === 'success').length;
    const successRate = messagesSent > 0 ? (successfulMessages / messagesSent) * 100 : 100;

    return {
      activeNotifications,
      connectedServers,
      messagesSent,
      successRate: Math.round(successRate * 10) / 10,
    };
  }
}

export const storage = new MemStorage();
