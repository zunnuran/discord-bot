import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Server, 
  Hash, 
  Users, 
  Settings, 
  Plus,
  MessageSquare,
  Shield,
  Crown,
  Mic
} from "lucide-react";

export default function ServerDetails() {
  const { serverId } = useParams();
  
  const { data: server } = useQuery({
    queryKey: ['/api/servers', serverId],
    enabled: !!serverId,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['/api/servers', serverId, 'channels'],
    enabled: !!serverId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const serverNotifications = notifications.filter(n => n.serverId === serverId);

  if (!server) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Server not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/servers">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Servers
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-discord-blurple rounded-lg flex items-center justify-center">
                {server.icon ? (
                  <img src={server.icon} alt={server.name} className="w-16 h-16 rounded-lg" />
                ) : (
                  <Server className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{server.name}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge className={server.isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {server.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <span className="text-gray-600 dark:text-gray-400">ID: {server.id}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link href={`/create?serverId=${serverId}`}>
                <Button className="discord-primary discord-primary-hover text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Notification
                </Button>
              </Link>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Server Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Channels</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{channels.length}</p>
                </div>
                <Hash className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Notifications</p>
                  <p className="text-2xl font-semibold text-green-600">{serverNotifications.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                  <p className="text-2xl font-semibold text-purple-600">{server.memberCount || 'N/A'}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Permission Level</p>
                  <p className="text-sm font-semibold text-orange-600">Administrator</p>
                </div>
                <Crown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Channels ({channels.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {channel.type === 'voice' ? (
                        <Mic className="h-4 w-4 text-green-600" />
                      ) : (
                        <Hash className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {channel.type === 'voice' ? 'Voice Channel' : 'Text Channel'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/create?serverId=${serverId}&channelId=${channel.id}`}>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Notify
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Active Notifications ({serverNotifications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serverNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No notifications scheduled for this server</p>
                    <Link href={`/create?serverId=${serverId}`}>
                      <Button size="sm" className="mt-3 discord-primary discord-primary-hover text-white">
                        Create First Notification
                      </Button>
                    </Link>
                  </div>
                ) : (
                  serverNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            #{channels.find(c => c.id === notification.channelId)?.name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline">{notification.repeat}</Badge>
                      </div>
                    </div>
                  ))
                )}
                {serverNotifications.length > 5 && (
                  <div className="text-center">
                    <Link href="/notifications">
                      <Button variant="outline" size="sm">
                        View All Notifications
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}