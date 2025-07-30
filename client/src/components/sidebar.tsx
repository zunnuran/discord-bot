import { Calendar, BarChart3, Settings, Server, List, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", icon: BarChart3, href: "/", current: true },
  { name: "Create Notification", icon: Plus, href: "/create", current: false },
  { name: "Scheduled Messages", icon: List, href: "/notifications", current: false },
  { name: "Servers", icon: Server, href: "/servers", current: false },
  { name: "Analytics", icon: BarChart3, href: "/analytics", current: false },
  { name: "Settings", icon: Settings, href: "/settings", current: false },
];

export default function Sidebar() {
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
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">JohnDoe#1234</p>
            <div className="flex items-center text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={item.current ? "default" : "ghost"}
            className={`w-full justify-start ${item.current ? "discord-primary text-white" : ""}`}
            asChild
          >
            <a href={item.href} className="flex items-center space-x-3">
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </a>
          </Button>
        ))}
      </nav>

      {/* Bot Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Bot Online</span>
          </div>
          <Badge variant="secondary" className="text-xs">v2.1.0</Badge>
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
