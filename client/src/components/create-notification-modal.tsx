import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Send } from "lucide-react";
import type { DiscordServer, DiscordChannel } from "@shared/schema";

const formSchema = z.object({
  serverId: z.string().min(1, "Please select a server"),
  channelId: z.string().min(1, "Please select a channel"),
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  scheduleDate: z.string().min(1, "Date is required"),
  scheduleTime: z.string().min(1, "Time is required"),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"]),
  endDate: z.string().optional(),
  timezone: z.string().default("UTC"),
  mentions: z.boolean().default(false),
  embeds: z.boolean().default(false),
  testMessage: z.boolean().default(false),
});

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateNotificationModal({ isOpen, onClose }: CreateNotificationModalProps) {
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverId: "",
      channelId: "",
      message: "",
      scheduleDate: "",
      scheduleTime: "",
      repeatType: "once",
      endDate: "",
      timezone: "UTC",
      mentions: false,
      embeds: false,
      testMessage: false,
    },
  });

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const { data: channels = [] } = useQuery<DiscordChannel[]>({
    queryKey: ["/api/servers", selectedServerId, "channels"],
    enabled: !!selectedServerId,
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const scheduleDateTime = new Date(`${data.scheduleDate}T${data.scheduleTime}`);
      return apiRequest("POST", "/api/notifications", {
        ...data,
        scheduleDate: scheduleDateTime.toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Notification scheduled successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    form.setValue("serverId", serverId);
    form.setValue("channelId", ""); // Reset channel when server changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Create New Notification</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Server and Channel Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Server *</FormLabel>
                    <Select onValueChange={handleServerChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a server..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
                            {server.name} ({server.memberCount?.toLocaleString()} members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedServerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message Content */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter your notification message..."
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    You can use Discord markdown formatting
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduling Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Scheduling Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduleTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="EST">EST (UTC-5)</SelectItem>
                            <SelectItem value="PST">PST (UTC-8)</SelectItem>
                            <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Repeat Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repeat Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="repeatType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="once">Once</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Advanced Options */}
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">Advanced Options</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="testMessage"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Send test message before scheduling</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mentions"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Enable mentions (@everyone, @here)</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="embeds"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Include embeds (rich content)</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="outline" className="discord-primary text-white border-0">
                Save as Draft
              </Button>
              <Button 
                type="submit" 
                className="discord-primary discord-primary-hover text-white"
                disabled={createMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Scheduling..." : "Schedule Notification"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
