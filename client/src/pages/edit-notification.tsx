import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationWithRelations, DiscordServer, DiscordChannel, NotificationLog } from "@shared/schema";

const formSchema = z.object({
  serverId: z.string().min(1, "Server is required"),
  channelId: z.string().min(1, "Channel is required"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
  scheduleDate: z.string().min(1, "Schedule date is required"),
  scheduleTime: z.string().min(1, "Schedule time is required"),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"]),
  endDate: z.string().optional(),
  timezone: z.string().default("UTC"),
  mentions: z.boolean().default(false),
  embeds: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export default function EditNotification() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedServerId, setSelectedServerId] = useState<string>("");

  const { data: notification, isLoading: notificationLoading } = useQuery<NotificationWithRelations>({
    queryKey: ["/api/notifications", id],
    enabled: !!id,
  });

  const { data: servers = [] } = useQuery<DiscordServer[]>({
    queryKey: ["/api/servers"],
  });

  const { data: channels = [] } = useQuery<DiscordChannel[]>({
    queryKey: ["/api/servers", selectedServerId, "channels"],
    enabled: !!selectedServerId,
  });

  const { data: logs = [] } = useQuery<NotificationLog[]>({
    queryKey: ["/api/notifications", id, "logs"],
    enabled: !!id,
  });

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
      isActive: true,
    },
  });

  useEffect(() => {
    if (notification) {
      const scheduleDateValue = notification.nextScheduled || notification.scheduleDate;
      const scheduleDate = scheduleDateValue 
        ? new Date(scheduleDateValue).toISOString().split("T")[0]
        : "";
      const scheduleTime = scheduleDateValue
        ? new Date(scheduleDateValue).toTimeString().slice(0, 5)
        : "";
      
      form.reset({
        serverId: String(notification.serverId),
        channelId: String(notification.channelId),
        message: notification.message,
        scheduleDate,
        scheduleTime,
        repeatType: notification.repeatType as "once" | "daily" | "weekly" | "monthly",
        endDate: notification.endDate ? new Date(notification.endDate).toISOString().split("T")[0] : "",
        timezone: notification.timezone || "UTC",
        mentions: notification.mentions ?? false,
        embeds: notification.embeds ?? false,
        isActive: notification.isActive ?? true,
      });
      setSelectedServerId(String(notification.serverId));
    }
  }, [notification, form]);

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      if (!data.scheduleDate || !data.scheduleTime) {
        throw new Error("Schedule date and time are required");
      }
      const scheduleDateTime = new Date(`${data.scheduleDate}T${data.scheduleTime}`);
      if (isNaN(scheduleDateTime.getTime())) {
        throw new Error("Invalid schedule date/time");
      }
      return apiRequest("PUT", `/api/notifications/${id}`, {
        serverId: parseInt(data.serverId, 10),
        channelId: parseInt(data.channelId, 10),
        message: data.message,
        scheduleDate: scheduleDateTime.toISOString(),
        repeatType: data.repeatType,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        timezone: data.timezone,
        mentions: data.mentions,
        embeds: data.embeds,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Notification updated successfully",
      });
      navigate("/notifications");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification",
        variant: "destructive",
      });
    },
  });

  const handleServerChange = (value: string) => {
    setSelectedServerId(value);
    form.setValue("serverId", value);
    form.setValue("channelId", "");
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  if (notificationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Notification Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The notification you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/notifications">
                <Button>Back to Notifications</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/notifications">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Notifications
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Notification</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Update your scheduled Discord message</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                                  <SelectItem key={server.id} value={String(server.id)}>
                                    {server.name}
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
                                  <SelectItem key={channel.id} value={String(channel.id)}>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Message Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter your notification message..."
                              rows={6}
                              className="resize-none"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Character count: {field.value?.length || 0}/2000
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scheduling Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name="repeatType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repeat</FormLabel>
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
                                <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                                <SelectItem value="Asia/Karachi">PKT (UTC+5)</SelectItem>
                                <SelectItem value="Asia/Kolkata">IST (UTC+5:30)</SelectItem>
                                <SelectItem value="Asia/Dubai">GST (UTC+4)</SelectItem>
                                <SelectItem value="Europe/London">GMT (UTC+0)</SelectItem>
                                <SelectItem value="America/New_York">EST (UTC-5)</SelectItem>
                                <SelectItem value="America/Los_Angeles">PST (UTC-8)</SelectItem>
                                <SelectItem value="Asia/Tokyo">JST (UTC+9)</SelectItem>
                                <SelectItem value="Australia/Sydney">AEST (UTC+10)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("repeatType") !== "once" && (
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
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-base">Active</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Enable or disable this notification
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mentions"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <FormLabel className="text-base">Mention Everyone</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Include @everyone in the message
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Link href="/notifications">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="discord-primary discord-primary-hover text-white"
                    disabled={updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Delivery History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No delivery history yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        {log.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={
                                log.status === "success"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }
                            >
                              {log.status}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.sentAt).toLocaleString()}
                            </span>
                          </div>
                          {log.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                              {log.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {notification.lastSent && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Last Sent:</strong>{" "}
                    {new Date(notification.lastSent).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
