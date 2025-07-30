import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, MessageSquare, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { Notification } from "@shared/schema";

export default function Analytics() {
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: stats } = useQuery<{
    activeNotifications: number;
    connectedServers: number;
    messagesSent: number;
    successRate: number;
  }>({
    queryKey: ["/api/stats"],
  });

  // Calculate analytics data
  const totalNotifications = notifications.length;
  const activeNotifications = notifications.filter(n => n.isActive).length;
  const inactiveNotifications = totalNotifications - activeNotifications;
  
  const repeatTypeStats = notifications.reduce((acc, n) => {
    acc[n.repeatType] = (acc[n.repeatType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = notifications
    .filter(n => n.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingNotifications = notifications
    .filter(n => n.nextScheduled && n.isActive)
    .sort((a, b) => new Date(a.nextScheduled!).getTime() - new Date(b.nextScheduled!).getTime())
    .slice(0, 5);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not scheduled";
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRepeatBadgeColor = (repeatType: string) => {
    switch (repeatType) {
      case "daily": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "weekly": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "monthly": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor your Discord bot performance and usage statistics</p>
            </div>
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalNotifications}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600">+12%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-semibold text-green-600">{activeNotifications}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600">+5</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.messagesSent || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600">+23%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.successRate || 0}%</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                <span className="text-red-600">-0.2%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Notification Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(repeatTypeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={`capitalize ${getRepeatBadgeColor(type)}`}>
                        {type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / totalNotifications) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                        {Math.round((count / totalNotifications) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
                {Object.keys(repeatTypeStats).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No notifications created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Active Notifications</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{activeNotifications}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium">Inactive Notifications</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-600">{inactiveNotifications}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Connected Servers</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{stats?.connectedServers || 0}</span>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.successRate || 0}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overall Success Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.message.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <Badge className={`capitalize ${getRepeatBadgeColor(notification.repeatType)}`}>
                        {notification.repeatType}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No upcoming notifications</p>
                  </div>
                ) : (
                  upcomingNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.message.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Scheduled for {formatDate(notification.nextScheduled)}
                        </p>
                      </div>
                      <Badge className={`capitalize ${getRepeatBadgeColor(notification.repeatType)}`}>
                        {notification.repeatType}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}