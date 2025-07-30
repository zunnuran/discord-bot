import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import NotificationList from "@/components/notification-list";
import CreateNotificationModal from "@/components/create-notification-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";
import type { DiscordServer, Notification } from "@shared/schema";

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your Discord bot notifications</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="discord-primary discord-primary-hover text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Notification
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                  3
                </Badge>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Recent Notifications */}
            <div className="lg:col-span-2">
              <NotificationList notifications={recentNotifications} />
            </div>

            {/* Quick Create & Server Status */}
            <div className="lg:col-span-1 space-y-6">
              {/* Server Status Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Server Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {servers.map((server) => (
                      <div key={server.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 discord-primary rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {server.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{server.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {server.memberCount?.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <CreateNotificationModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
