import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNotificationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/discord", async (req, res) => {
    // For development, return a mock user
    const mockUser = {
      id: "user1",
      discordId: "123456789",
      username: "JohnDoe",
      discriminator: "1234",
      avatar: null,
      accessToken: "mock_token",
      refreshToken: "mock_refresh",
      createdAt: new Date()
    };
    
    res.json({ user: mockUser });
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true });
  });

  // User routes
  app.get("/api/user", async (req, res) => {
    // For development, return mock user
    const mockUser = {
      id: "user1",
      discordId: "123456789",
      username: "JohnDoe",
      discriminator: "1234",
      avatar: null,
      accessToken: "mock_token",
      refreshToken: "mock_refresh",
      createdAt: new Date()
    };
    
    res.json(mockUser);
  });

  // Server routes
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  app.get("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const { serverId } = req.params;
      const channels = await storage.getChannelsByServer(serverId);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      // For development, use mock user ID
      const notifications = await storage.getNotifications("user1");
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        userId: "user1" // Mock user ID for development
      });
      
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create notification" });
      }
    }
  });

  app.put("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertNotificationSchema.partial().parse(req.body);
      
      const notification = await storage.updateNotification(id, validatedData);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update notification" });
      }
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      // For development, use mock user ID
      const stats = await storage.getStats("user1");
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
