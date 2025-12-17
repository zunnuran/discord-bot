import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Server, Users, Hash, Settings, RefreshCw } from "lucide-react";
import type { DiscordServer, DiscordChannel } from "@shared/schema";

export default function Servers() {
  const [selectedServer, setSelectedServer] = useState<DiscordServer | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const handleOpenSettings = (server: DiscordServer) => {
    setSelectedServer(server);
    setIsSettingsOpen(true);
  };

  const ServerCard = ({ server }: { server: DiscordServer }) => {
    const { data: channels = [] } = useQuery<DiscordChannel[]>({
      queryKey: ["/api/servers", server.id, "channels"],
    });

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 discord-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {server.name.charAt(0)}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg">{server.name}</CardTitle>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{server.memberCount?.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Hash className="h-4 w-4" />
                    <span>{channels.length} channels</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {server.isConnected ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Disconnected</Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleOpenSettings(server)}
                data-testid={`button-server-settings-${server.id}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Available Channels</h4>
              <div className="grid grid-cols-2 gap-2">
                {channels.slice(0, 6).map((channel) => (
                  <div key={channel.id} className="flex items-center space-x-2 text-sm">
                    <Hash className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{channel.name}</span>
                  </div>
                ))}
                {channels.length > 6 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    +{channels.length - 6} more channels
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Server ID: {server.id}
              </div>
              <div className="flex space-x-2">
                <Link href={`/servers/${server.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
                <Link href={`/create?serverId=${server.id}`}>
                  <Button size="sm" className="discord-primary discord-primary-hover text-white">
                    Create Notification
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discord Servers</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your connected Discord servers and channels</p>
            </div>
            <Button className="discord-primary discord-primary-hover text-white" onClick={() => {
              const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
              if (!clientId || clientId === 'YOUR_BOT_ID') {
                alert('Discord Application ID not configured. Please add VITE_DISCORD_CLIENT_ID in Settings.');
                return;
              }
              window.open(`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147485696&scope=bot`, '_blank');
            }}>
              <Server className="mr-2 h-4 w-4" />
              Add Server
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Servers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{servers.length}</p>
                </div>
                <Server className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connected</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {servers.filter(s => s.isConnected).length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {servers.reduce((sum, s) => sum + (s.memberCount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Size</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {servers.length > 0 ? Math.round(servers.reduce((sum, s) => sum + (s.memberCount || 0), 0) / servers.length).toLocaleString() : 0}
                  </p>
                </div>
                <Hash className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Servers</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {servers.length} server{servers.length !== 1 ? 's' : ''} total
            </div>
          </div>
          
          {servers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No servers connected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect your Discord bot to servers to start sending notifications
                </p>
                <Button className="discord-primary discord-primary-hover text-white">
                  <Server className="mr-2 h-4 w-4" />
                  Connect First Server
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Server Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Server Settings</span>
            </DialogTitle>
            <DialogDescription>
              Configure settings for {selectedServer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedServer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 discord-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {selectedServer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedServer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedServer.memberCount?.toLocaleString()} members
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Connection Status</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bot connection to this server</p>
                  </div>
                  <Badge className={selectedServer.isConnected 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  }>
                    {selectedServer.isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Server ID</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Discord server identifier</p>
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {selectedServer.discordId}
                  </code>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Link href={`/create?serverId=${selectedServer.id}`} className="flex-1">
                  <Button className="w-full discord-primary discord-primary-hover text-white">
                    Create Notification
                  </Button>
                </Link>
                <Link href={`/servers/${selectedServer.id}`}>
                  <Button variant="outline">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}