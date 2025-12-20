import { Calendar, BarChart3, Settings, Server, Bell, Plus, LogOut, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface BotStatus {
  isOnline: boolean;
  botName: string | null;
  botId: string | null;
  serverCount: number;
}

const navigation = [
  { name: "Dashboard", icon: BarChart3, href: "/" },
  { name: "Notifications", icon: Bell, href: "/notifications" },
  { name: "Create Notification", icon: Plus, href: "/create" },
  { name: "Forwarders", icon: Forward, href: "/forwarders" },
  { name: "Servers", icon: Server, href: "/servers" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const { data: botStatus, isLoading: isBotStatusLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!user, // Only fetch when user is authenticated
  });
  
  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 discord-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">Discord Scheduler</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bot Manager</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt="User avatar" />
            <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username || "User"}</p>
            <div className="flex items-center text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${isActive ? "discord-primary text-white" : ""}`}
              >
                <item.icon className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bot Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isBotStatusLoading ? (
              <>
                <span className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
              </>
            ) : (
              <>
                <span className={`w-3 h-3 rounded-full ${botStatus?.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {botStatus?.isOnline ? 'Bot Online' : 'Bot Offline'}
                </span>
              </>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">v2.1.0</Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
