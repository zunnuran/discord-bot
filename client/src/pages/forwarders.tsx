import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Edit, Forward, Power, Search, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ForwarderWithRelations, DiscordServer, DiscordChannel } from "@shared/schema";

interface ChannelsWithThreads {
  channels: DiscordChannel[];
  threads: { id: string; name: string; parentId: string }[];
}

interface ForwarderLog {
  id: number;
  forwarderId: number;
  originalMessage: string | null;
  matchedKeyword: string | null;
  status: string;
  error: string | null;
  forwardedAt: string;
}

export default function Forwarders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingForwarder, setEditingForwarder] = useState<ForwarderWithRelations | null>(null);
  const [viewingLogsForwarder, setViewingLogsForwarder] = useState<ForwarderWithRelations | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: forwarders = [], isLoading } = useQuery<ForwarderWithRelations[]>({
    queryKey: ["/api/forwarders"],
  });

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/forwarders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forwarders"] });
      toast({ title: "Success", description: "Forwarder deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete forwarder", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/forwarders/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forwarders"] });
      toast({ title: "Success", description: "Forwarder status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to toggle forwarder", variant: "destructive" });
    },
  });

  const filteredForwarders = forwarders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = forwarders.filter(f => f.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Message Forwarders</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor channels and forward messages with keywords</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="discord-primary discord-primary-hover text-white" data-testid="button-create-forwarder">
                  <Plus className="mr-2 h-4 w-4" />
                  New Forwarder
                </Button>
              </DialogTrigger>
              <ForwarderDialog
                servers={servers}
                onSuccess={() => {
                  setIsCreateOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/forwarders"] });
                }}
                onClose={() => setIsCreateOpen(false)}
              />
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Forwarders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-forwarders">{forwarders.length}</p>
                </div>
                <Forward className="h-10 w-10 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-active-forwarders">{activeCount}</p>
                </div>
                <Power className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
                  <p className="text-3xl font-bold text-gray-600" data-testid="text-inactive-forwarders">{forwarders.length - activeCount}</p>
                </div>
                <Power className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forwarders ({filteredForwarders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredForwarders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No forwarders match your search" : "No forwarders configured yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredForwarders.map((forwarder) => (
                  <div
                    key={forwarder.id}
                    className="p-4 border rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between"
                    data-testid={`card-forwarder-${forwarder.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">{forwarder.name}</h3>
                        <Badge variant={forwarder.isActive ? "default" : "secondary"}>
                          {forwarder.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">From:</span> {forwarder.sourceServer?.name} / #{forwarder.sourceChannel?.name}
                        {forwarder.sourceThreadId && <span className="text-xs"> (thread)</span>}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">To:</span> {forwarder.destinationServer?.name} / #{forwarder.destinationChannel?.name}
                        {forwarder.destinationThreadId && <span className="text-xs"> (thread)</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {forwarder.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={forwarder.isActive ?? false}
                        onCheckedChange={() => toggleMutation.mutate(forwarder.id)}
                        data-testid={`switch-toggle-${forwarder.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingLogsForwarder(forwarder)}
                        data-testid={`button-logs-${forwarder.id}`}
                        title="View logs"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingForwarder(forwarder)}
                            data-testid={`button-edit-${forwarder.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {editingForwarder?.id === forwarder.id && (
                          <ForwarderDialog
                            servers={servers}
                            forwarder={editingForwarder}
                            onSuccess={() => {
                              setEditingForwarder(null);
                              queryClient.invalidateQueries({ queryKey: ["/api/forwarders"] });
                            }}
                            onClose={() => setEditingForwarder(null)}
                          />
                        )}
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this forwarder?")) {
                            deleteMutation.mutate(forwarder.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`button-delete-${forwarder.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {viewingLogsForwarder && (
        <Dialog open={!!viewingLogsForwarder} onOpenChange={(open) => !open && setViewingLogsForwarder(null)}>
          <LogsDialog 
            forwarder={viewingLogsForwarder} 
            onClose={() => setViewingLogsForwarder(null)} 
          />
        </Dialog>
      )}
    </div>
  );
}

function LogsDialog({ forwarder, onClose }: { forwarder: ForwarderWithRelations; onClose: () => void }) {
  const { data: logs = [], isLoading } = useQuery<ForwarderLog[]>({
    queryKey: ["/api/forwarders", forwarder.id, "logs"],
    enabled: !!forwarder.id,
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Forwarding Logs - {forwarder.name}</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No forwarding logs yet. Messages matching your keywords will appear here when forwarded.
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(log.forwardedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">
                    <span className="font-medium">Original:</span> {log.originalMessage?.substring(0, 200) || "N/A"}
                    {(log.originalMessage?.length || 0) > 200 && "..."}
                  </div>
                  {log.matchedKeyword && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Matched: "{log.matchedKeyword}"
                    </div>
                  )}
                  {log.error && (
                    <div className="text-red-500 text-xs mt-1">
                      Error: {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ForwarderDialog({
  servers,
  forwarder,
  onSuccess,
  onClose,
}: {
  servers: DiscordServer[];
  forwarder?: ForwarderWithRelations | null;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(forwarder?.name || "");
  const [sourceServerId, setSourceServerId] = useState<string>(forwarder?.sourceServerId?.toString() || "");
  const [sourceChannelId, setSourceChannelId] = useState<string>(forwarder?.sourceChannelId?.toString() || "");
  const [sourceThreadId, setSourceThreadId] = useState<string>(forwarder?.sourceThreadId || "");
  const [destinationServerId, setDestinationServerId] = useState<string>(forwarder?.destinationServerId?.toString() || "");
  const [destinationChannelId, setDestinationChannelId] = useState<string>(forwarder?.destinationChannelId?.toString() || "");
  const [destinationThreadId, setDestinationThreadId] = useState<string>(forwarder?.destinationThreadId || "");
  const [keywords, setKeywords] = useState<string>(forwarder?.keywords?.join(", ") || "");
  const [matchType, setMatchType] = useState<string>(forwarder?.matchType || "contains");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: sourceChannelsData } = useQuery<ChannelsWithThreads>({
    queryKey: ["/api/servers", sourceServerId, "channels-with-threads"],
    enabled: !!sourceServerId,
  });

  const { data: destChannelsData } = useQuery<ChannelsWithThreads>({
    queryKey: ["/api/servers", destinationServerId, "channels-with-threads"],
    enabled: !!destinationServerId,
  });

  const handleSubmit = async () => {
    if (!name || !sourceServerId || !sourceChannelId || !destinationServerId || !destinationChannelId || !keywords.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const keywordsArray = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0);
    if (keywordsArray.length === 0) {
      toast({ title: "Error", description: "At least one keyword is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        sourceServerId: parseInt(sourceServerId),
        sourceChannelId: parseInt(sourceChannelId),
        sourceThreadId: sourceThreadId || null,
        destinationServerId: parseInt(destinationServerId),
        destinationChannelId: parseInt(destinationChannelId),
        destinationThreadId: destinationThreadId || null,
        keywords: keywordsArray,
        matchType,
        isActive: true,
      };

      if (forwarder) {
        await apiRequest("PUT", `/api/forwarders/${forwarder.id}`, payload);
        toast({ title: "Success", description: "Forwarder updated successfully" });
      } else {
        await apiRequest("POST", "/api/forwarders", payload);
        toast({ title: "Success", description: "Forwarder created successfully" });
      }
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save forwarder", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{forwarder ? "Edit Forwarder" : "Create Forwarder"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Important Announcements"
            data-testid="input-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Source Server</Label>
            <Select value={sourceServerId} onValueChange={(v) => { setSourceServerId(v); setSourceChannelId(""); setSourceThreadId(""); }}>
              <SelectTrigger data-testid="select-source-server">
                <SelectValue placeholder="Select server" />
              </SelectTrigger>
              <SelectContent>
                {servers.filter(s => s.isConnected).map(server => (
                  <SelectItem key={server.id} value={server.id.toString()}>{server.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source Channel</Label>
            <Select value={sourceChannelId} onValueChange={setSourceChannelId} disabled={!sourceServerId}>
              <SelectTrigger data-testid="select-source-channel">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {sourceChannelsData?.channels.map(channel => (
                  <SelectItem key={channel.id} value={channel.id.toString()}>#{channel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(() => {
          const selectedChannel = sourceChannelsData?.channels.find(c => c.id.toString() === sourceChannelId);
          const filteredThreads = sourceChannelsData?.threads?.filter(t => t.parentId === selectedChannel?.discordId) || [];
          return filteredThreads.length > 0 && (
            <div>
              <Label>Source Thread (Optional)</Label>
              <Select value={sourceThreadId || "none"} onValueChange={(v) => setSourceThreadId(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="select-source-thread">
                  <SelectValue placeholder="Select thread (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No thread</SelectItem>
                  {filteredThreads.map(thread => (
                    <SelectItem key={thread.id} value={thread.id}>{thread.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Destination Server</Label>
            <Select value={destinationServerId} onValueChange={(v) => { setDestinationServerId(v); setDestinationChannelId(""); setDestinationThreadId(""); }}>
              <SelectTrigger data-testid="select-dest-server">
                <SelectValue placeholder="Select server" />
              </SelectTrigger>
              <SelectContent>
                {servers.filter(s => s.isConnected).map(server => (
                  <SelectItem key={server.id} value={server.id.toString()}>{server.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destination Channel</Label>
            <Select value={destinationChannelId} onValueChange={setDestinationChannelId} disabled={!destinationServerId}>
              <SelectTrigger data-testid="select-dest-channel">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {destChannelsData?.channels.map(channel => (
                  <SelectItem key={channel.id} value={channel.id.toString()}>#{channel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(() => {
          const selectedChannel = destChannelsData?.channels.find(c => c.id.toString() === destinationChannelId);
          const filteredThreads = destChannelsData?.threads?.filter(t => t.parentId === selectedChannel?.discordId) || [];
          return filteredThreads.length > 0 && (
            <div>
              <Label>Destination Thread (Optional)</Label>
              <Select value={destinationThreadId || "none"} onValueChange={(v) => setDestinationThreadId(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="select-dest-thread">
                  <SelectValue placeholder="Select thread (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No thread</SelectItem>
                  {filteredThreads.map(thread => (
                    <SelectItem key={thread.id} value={thread.id}>{thread.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })()}

        <div>
          <Label htmlFor="keywords">Keywords (comma-separated)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., urgent, important, alert"
            data-testid="input-keywords"
          />
          <p className="text-xs text-gray-500 mt-1">Messages containing these keywords will be forwarded</p>
        </div>

        <div>
          <Label>Match Type</Label>
          <Select value={matchType} onValueChange={setMatchType}>
            <SelectTrigger data-testid="select-match-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains keyword</SelectItem>
              <SelectItem value="exact">Exact match</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="discord-primary" data-testid="button-submit">
          {isSubmitting ? "Saving..." : (forwarder ? "Update" : "Create")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
