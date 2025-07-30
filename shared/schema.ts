import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: text("discriminator").notNull(),
  avatar: text("avatar"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const discordServers = pgTable("discord_servers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  memberCount: integer("member_count").default(0),
  isConnected: boolean("is_connected").default(true),
});

export const discordChannels = pgTable("discord_channels", {
  id: varchar("id").primaryKey(),
  serverId: varchar("server_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  serverId: varchar("server_id").notNull(),
  channelId: varchar("channel_id").notNull(),
  message: text("message").notNull(),
  scheduleDate: timestamp("schedule_date").notNull(),
  repeatType: text("repeat_type").notNull(), // 'once', 'daily', 'weekly', 'monthly'
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  timezone: text("timezone").default("UTC"),
  mentions: boolean("mentions").default(false),
  embeds: boolean("embeds").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSent: timestamp("last_sent"),
  nextScheduled: timestamp("next_scheduled"),
});

export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  error: text("error"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDiscordServerSchema = createInsertSchema(discordServers);

export const insertDiscordChannelSchema = createInsertSchema(discordChannels);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  lastSent: true,
  nextScheduled: true,
}).extend({
  scheduleDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  id: true,
  sentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DiscordServer = typeof discordServers.$inferSelect;
export type InsertDiscordServer = z.infer<typeof insertDiscordServerSchema>;

export type DiscordChannel = typeof discordChannels.$inferSelect;
export type InsertDiscordChannel = z.infer<typeof insertDiscordChannelSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
