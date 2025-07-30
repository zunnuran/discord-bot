import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Server, MessageSquare, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const statsData = [
    {
      title: "Active Notifications",
      value: stats?.activeNotifications || 0,
      icon: Calendar,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      trend: "+12%",
      trendDirection: "up",
      trendText: "from last week",
    },
    {
      title: "Connected Servers",
      value: stats?.connectedServers || 0,
      icon: Server,
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/20",
      trend: "+2",
      trendDirection: "up",
      trendText: "new this month",
    },
    {
      title: "Messages Sent",
      value: stats?.messagesSent || 0,
      icon: MessageSquare,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      trend: "+8%",
      trendDirection: "up",
      trendText: "from last week",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/20",
      trend: "-0.1%",
      trendDirection: "down",
      trendText: "from last week",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center ${
                stat.trendDirection === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {stat.trendDirection === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stat.trend}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">{stat.trendText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
