import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus, Search, Filter, ArrowLeft, Clock, MessageSquare, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification, DiscordServer } from "@shared/schema";

export default function Notifications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRepeat, setFilterRepeat] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const getRepeatBadgeColor = (repeatType: string) => {
    switch (repeatType) {
      case "daily": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "weekly": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "monthly": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    }
  };

  const formatNextScheduled = (nextScheduled: Date | null, scheduleDate?: Date | null) => {
    const date = nextScheduled || scheduleDate;
    if (!date) return "Not scheduled";
    
    const now = new Date();
    const scheduled = new Date(date);
    const isToday = scheduled.toDateString() === now.toDateString();
    const isTomorrow = scheduled.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeStr = scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return `${scheduled.toLocaleDateString()} at ${timeStr}`;
  };

  const getServerName = (serverId: number) => {
    return servers.find(s => s.id === serverId)?.name || `Server ${serverId}`;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getServerName(notification.serverId).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && notification.isActive) ||
                         (filterStatus === "inactive" && !notification.isActive);
    
    const matchesRepeat = filterRepeat === "all" || notification.repeatType === filterRepeat;
    
    return matchesSearch && matchesStatus && matchesRepeat;
  });

  const activeCount = notifications.filter(n => n.isActive).length;
  const inactiveCount = notifications.length - activeCount;

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scheduled Messages</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Manage all your Discord notifications</p>
            </div>
            <Link href="/create">
              <Button className="discord-primary discord-primary-hover text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Notification
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{notifications.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="text-2xl font-semibold text-gray-600">{inactiveCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search notifications or servers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterRepeat} onValueChange={setFilterRepeat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {notifications.length === 0 ? "Create your first notification to get started" : "Try adjusting your search or filters"}
                </p>
                {notifications.length === 0 && (
                  <Link href="/create">
                    <Button className="mt-4 discord-primary discord-primary-hover text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Notification
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={`capitalize ${getRepeatBadgeColor(notification.repeatType)}`}>
                            {notification.repeatType}
                          </Badge>
                          {notification.isActive ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {getServerName(notification.serverId)} • #{notification.channelId}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                          <span>Next: {formatNextScheduled(notification.nextScheduled, notification.scheduleDate)}</span>
                          <span>Created: {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}</span>
                          {notification.timezone && (
                            <span>Timezone: {notification.timezone}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/notifications/${notification.id}/edit`)}
                          data-testid={`button-edit-${notification.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => deleteMutation.mutate(notification.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}