import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { 
  type InsertUser,
  type InsertDiscordServer,
  type InsertDiscordChannel,
  type InsertNotification,
} from "@shared/schema";
import { z } from "zod";

// Validation schemas
const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
});

const serverSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
  name: z.string().min(1, "Server name is required"),
  icon: z.string().optional().nullable(),
  memberCount: z.number().optional().nullable(),
  isConnected: z.boolean().optional(),
});

const channelSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
  serverId: z.number(),
  name: z.string().min(1, "Channel name is required"),
  type: z.enum(["text", "voice"]).optional(),
});

const notificationSchema = z.object({
  userId: z.number(),
  serverId: z.number(),
  channelId: z.number(),
  title: z.string().optional().nullable(),
  message: z.string().min(1, "Message is required"),
  scheduleDate: z.coerce.date(),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"]).optional(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  timezone: z.string().optional(),
  mentions: z.boolean().optional(),
  embeds: z.boolean().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth
  await setupAuth(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============ User Management Routes (admin only) ============
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const data = userSchema.parse(req.body) as InsertUser;
      
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(data);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = userSchema.partial().parse(req.body) as Partial<InsertUser>;
      
      if (data.username) {
        const existing = await storage.getUserByUsername(data.username);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const user = await storage.updateUser(id, data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting own account
      if ((req as any).user?.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============ Server Routes ============
  app.get("/api/servers", isAuthenticated, async (req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      console.error("Error fetching servers:", error);
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  app.get("/api/servers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.getServer(id);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      console.error("Error fetching server:", error);
      res.status(500).json({ message: "Failed to fetch server" });
    }
  });

  app.post("/api/servers", isAuthenticated, async (req, res) => {
    try {
      const data = serverSchema.parse(req.body) as InsertDiscordServer;
      
      const existing = await storage.getServerByDiscordId(data.discordId);
      if (existing) {
        return res.status(400).json({ message: "Server already exists" });
      }
      
      const server = await storage.createServer(data);
      res.status(201).json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error creating server:", error);
        res.status(500).json({ message: "Failed to create server" });
      }
    }
  });

  app.put("/api/servers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = serverSchema.partial().parse(req.body) as Partial<InsertDiscordServer>;
      
      const server = await storage.updateServer(id, data);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error updating server:", error);
        res.status(500).json({ message: "Failed to update server" });
      }
    }
  });

  app.delete("/api/servers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServer(id);
      if (!success) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting server:", error);
      res.status(500).json({ message: "Failed to delete server" });
    }
  });

  // ============ Channel Routes ============
  app.get("/api/servers/:serverId/channels", isAuthenticated, async (req, res) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const channels = await storage.getChannelsByServer(serverId);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.post("/api/servers/:serverId/channels", isAuthenticated, async (req, res) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const data = channelSchema.parse({
        ...req.body,
        serverId,
      }) as InsertDiscordChannel;
      
      const existing = await storage.getChannelByDiscordId(data.discordId);
      if (existing) {
        return res.status(400).json({ message: "Channel already exists" });
      }
      
      const channel = await storage.createChannel(data);
      res.status(201).json(channel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error creating channel:", error);
        res.status(500).json({ message: "Failed to create channel" });
      }
    }
  });

  app.delete("/api/channels/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteChannel(id);
      if (!success) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });

  // ============ Notification Routes ============
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      
      // Admins see all notifications, users see only their own
      const notifications = isUserAdmin 
        ? await storage.getNotifications()
        : await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotification(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check ownership unless admin
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      if (!isUserAdmin && notification.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ message: "Failed to fetch notification" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const data = notificationSchema.parse({
        ...req.body,
        userId,
      }) as InsertNotification;
      
      const notification = await storage.createNotification(data);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: "Failed to create notification" });
      }
    }
  });

  app.put("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotification = await storage.getNotification(id);
      
      if (!existingNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check ownership unless admin
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      if (!isUserAdmin && existingNotification.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const notification = await storage.updateNotification(id, req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.patch("/api/notifications/:id/toggle", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotification = await storage.getNotification(id);
      
      if (!existingNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check ownership unless admin
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      if (!isUserAdmin && existingNotification.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const notification = await storage.updateNotification(id, {
        isActive: !existingNotification.isActive,
      });
      res.json(notification);
    } catch (error) {
      console.error("Error toggling notification:", error);
      res.status(500).json({ message: "Failed to toggle notification" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotification = await storage.getNotification(id);
      
      if (!existingNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check ownership unless admin
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      if (!isUserAdmin && existingNotification.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteNotification(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // ============ Bot Settings Routes ============
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      // Don't expose bot token to non-admins
      if (settings && (req as any).user?.role !== "admin") {
        const { botToken, ...safeSettings } = settings;
        return res.json(safeSettings);
      }
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.updateBotSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // ============ Stats Route ============
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      
      // Admins see all stats, users see only their own
      const stats = isUserAdmin
        ? await storage.getStats()
        : await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ============ Notification Logs Routes ============
  app.get("/api/notifications/:id/logs", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check ownership unless admin
      const userId = (req as any).user?.id;
      const isUserAdmin = (req as any).user?.role === "admin";
      if (!isUserAdmin && notification.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const logs = await storage.getNotificationLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      res.status(500).json({ message: "Failed to fetch notification logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
