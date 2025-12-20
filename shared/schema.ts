import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for connect-pg-simple
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users with role-based access
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 200 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discord Servers
export const discordServers = pgTable("discord_servers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  discordId: varchar("discord_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  icon: text("icon"),
  memberCount: integer("member_count").default(0),
  isConnected: boolean("is_connected").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discord Channels
export const discordChannels = pgTable("discord_channels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  discordId: varchar("discord_id", { length: 100 }).notNull().unique(),
  serverId: integer("server_id").references(() => discordServers.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled Notifications
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serverId: integer("server_id").references(() => discordServers.id).notNull(),
  channelId: integer("channel_id").references(() => discordChannels.id).notNull(),
  title: varchar("title", { length: 200 }),
  message: text("message").notNull(),
  scheduleDate: timestamp("schedule_date").notNull(),
  repeatType: varchar("repeat_type", { length: 50 }).notNull().default("once"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  mentions: boolean("mentions").default(false),
  embeds: boolean("embeds").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastSent: timestamp("last_sent"),
  nextScheduled: timestamp("next_scheduled"),
});

// Notification Logs
export const notificationLogs = pgTable("notification_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  notificationId: integer("notification_id").references(() => notifications.id).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  error: text("error"),
});

// Message Forwarders
export const forwarders = pgTable("forwarders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  sourceServerId: integer("source_server_id").references(() => discordServers.id).notNull(),
  sourceChannelId: integer("source_channel_id").references(() => discordChannels.id).notNull(),
  sourceThreadId: varchar("source_thread_id", { length: 100 }),
  destinationServerId: integer("destination_server_id").references(() => discordServers.id).notNull(),
  destinationChannelId: integer("destination_channel_id").references(() => discordChannels.id).notNull(),
  destinationThreadId: varchar("destination_thread_id", { length: 100 }),
  keywords: text("keywords").array().notNull(),
  matchType: varchar("match_type", { length: 50 }).notNull().default("contains"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forwarder Logs
export const forwarderLogs = pgTable("forwarder_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  forwarderId: integer("forwarder_id").references(() => forwarders.id).notNull(),
  forwardedAt: timestamp("forwarded_at").defaultNow().notNull(),
  originalMessage: text("original_message"),
  matchedKeyword: varchar("matched_keyword", { length: 200 }),
  status: varchar("status", { length: 50 }).notNull(),
  error: text("error"),
});

// Bot Settings (global settings for the Discord bot)
export const botSettings = pgTable("bot_settings", {
  id: integer("id").primaryKey().default(1),
  botToken: text("bot_token"),
  defaultTimezone: varchar("default_timezone", { length: 50 }).default("UTC"),
  maxMessagesPerMinute: integer("max_messages_per_minute").default(10),
  enableAnalytics: boolean("enable_analytics").default(true),
  autoCleanupDays: integer("auto_cleanup_days").default(30),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const discordServersRelations = relations(discordServers, ({ many }) => ({
  channels: many(discordChannels),
  notifications: many(notifications),
}));

export const discordChannelsRelations = relations(discordChannels, ({ one, many }) => ({
  server: one(discordServers, {
    fields: [discordChannels.serverId],
    references: [discordServers.id],
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  server: one(discordServers, {
    fields: [notifications.serverId],
    references: [discordServers.id],
  }),
  channel: one(discordChannels, {
    fields: [notifications.channelId],
    references: [discordChannels.id],
  }),
  logs: many(notificationLogs),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationLogs.notificationId],
    references: [notifications.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
  forwarders: many(forwarders),
}));

export const forwardersRelations = relations(forwarders, ({ one, many }) => ({
  user: one(users, {
    fields: [forwarders.userId],
    references: [users.id],
  }),
  sourceServer: one(discordServers, {
    fields: [forwarders.sourceServerId],
    references: [discordServers.id],
    relationName: "sourceServer",
  }),
  sourceChannel: one(discordChannels, {
    fields: [forwarders.sourceChannelId],
    references: [discordChannels.id],
    relationName: "sourceChannel",
  }),
  destinationServer: one(discordServers, {
    fields: [forwarders.destinationServerId],
    references: [discordServers.id],
    relationName: "destinationServer",
  }),
  destinationChannel: one(discordChannels, {
    fields: [forwarders.destinationChannelId],
    references: [discordChannels.id],
    relationName: "destinationChannel",
  }),
  logs: many(forwarderLogs),
}));

export const forwarderLogsRelations = relations(forwarderLogs, ({ one }) => ({
  forwarder: one(forwarders, {
    fields: [forwarderLogs.forwarderId],
    references: [forwarders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
} as const);

export const insertDiscordServerSchema = createInsertSchema(discordServers, {
  discordId: z.string().min(1, "Discord ID is required"),
  name: z.string().min(1, "Server name is required"),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
} as const);

export const insertDiscordChannelSchema = createInsertSchema(discordChannels, {
  discordId: z.string().min(1, "Discord ID is required"),
  name: z.string().min(1, "Channel name is required"),
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
} as const);

export const insertNotificationSchema = createInsertSchema(notifications, {
  message: z.string().min(1, "Message is required"),
  scheduleDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSent: true,
  nextScheduled: true,
} as const);

export const insertNotificationLogSchema = createInsertSchema(notificationLogs, {
  status: z.string().min(1, "Status is required"),
}).omit({
  id: true,
  sentAt: true,
} as const);

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  updatedAt: true,
} as const);

export const insertForwarderSchema = createInsertSchema(forwarders, {
  name: z.string().min(1, "Name is required"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertForwarderLogSchema = createInsertSchema(forwarderLogs, {
  status: z.string().min(1, "Status is required"),
}).omit({
  id: true,
  forwardedAt: true,
} as const);

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = {
  username: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string;
  isActive?: boolean | null;
};

export type DiscordServer = typeof discordServers.$inferSelect;
export type InsertDiscordServer = {
  discordId: string;
  name: string;
  icon?: string | null;
  memberCount?: number | null;
  isConnected?: boolean | null;
};

export type DiscordChannel = typeof discordChannels.$inferSelect;
export type InsertDiscordChannel = {
  discordId: string;
  serverId: number;
  name: string;
  type?: string;
};

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = {
  userId: number;
  serverId: number;
  channelId: number;
  title?: string | null;
  message: string;
  scheduleDate: Date;
  repeatType?: string;
  endDate?: Date | null;
  isActive?: boolean | null;
  timezone?: string | null;
  mentions?: boolean | null;
  embeds?: boolean | null;
};

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = {
  notificationId: number;
  status: string;
  error?: string | null;
};

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = {
  id?: number;
  botToken?: string | null;
  defaultTimezone?: string | null;
  maxMessagesPerMinute?: number | null;
  enableAnalytics?: boolean | null;
  autoCleanupDays?: number | null;
};

// Extended types with relations
export type NotificationWithRelations = Notification & {
  server?: DiscordServer | null;
  channel?: DiscordChannel | null;
  user?: User | null;
};

export type DiscordServerWithChannels = DiscordServer & {
  channels?: DiscordChannel[];
};

export type Forwarder = typeof forwarders.$inferSelect;
export type InsertForwarder = {
  userId: number;
  name: string;
  sourceServerId: number;
  sourceChannelId: number;
  sourceThreadId?: string | null;
  destinationServerId: number;
  destinationChannelId: number;
  destinationThreadId?: string | null;
  keywords: string[];
  matchType?: string;
  isActive?: boolean | null;
};

export type ForwarderLog = typeof forwarderLogs.$inferSelect;
export type InsertForwarderLog = {
  forwarderId: number;
  originalMessage?: string | null;
  matchedKeyword?: string | null;
  status: string;
  error?: string | null;
};

export type ForwarderWithRelations = Forwarder & {
  sourceServer?: DiscordServer | null;
  sourceChannel?: DiscordChannel | null;
  destinationServer?: DiscordServer | null;
  destinationChannel?: DiscordChannel | null;
  user?: User | null;
};
