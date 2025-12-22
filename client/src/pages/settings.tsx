import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Settings2, 
  Bot, 
  Bell, 
  Shield, 
  Database,
  Save,
  AlertTriangle,
  LogOut,
  User
} from "lucide-react";

interface BotSettings {
  id: number;
  botToken: string | null;
  defaultTimezone: string | null;
  maxMessagesPerMinute: number | null;
  enableAnalytics: boolean | null;
  autoCleanupDays: number | null;
  workingDays: number[] | null;
}

const DAYS_OF_WEEK = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

interface BotStatus {
  isOnline: boolean;
  botName: string | null;
  botId: string | null;
  serverCount: number;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user, logout, isAdmin } = useAuth();

  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const [localSettings, setLocalSettings] = useState({
    defaultTimezone: settings?.defaultTimezone || "UTC",
    maxMessagesPerMinute: settings?.maxMessagesPerMinute || 10,
    enableAnalytics: settings?.enableAnalytics ?? true,
    autoCleanupDays: settings?.autoCleanupDays || 30,
    workingDays: settings?.workingDays || [1, 2, 3, 4, 5],
    rateLimitEnabled: true,
    enableWebhooks: true,
    notificationLimit: 50,
    logLevel: "info",
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({
        ...prev,
        defaultTimezone: settings.defaultTimezone || "UTC",
        maxMessagesPerMinute: settings.maxMessagesPerMinute || 10,
        enableAnalytics: settings.enableAnalytics ?? true,
        autoCleanupDays: settings.autoCleanupDays || 30,
        workingDays: settings.workingDays || [1, 2, 3, 4, 5],
      }));
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<BotSettings>) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your bot settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      defaultTimezone: localSettings.defaultTimezone,
      maxMessagesPerMinute: localSettings.maxMessagesPerMinute,
      enableAnalytics: localSettings.enableAnalytics,
      autoCleanupDays: localSettings.autoCleanupDays,
      workingDays: localSettings.workingDays,
    });
  };

  const toggleWorkingDay = (dayId: number) => {
    setLocalSettings(prev => {
      const days = prev.workingDays || [];
      if (days.includes(dayId)) {
        return { ...prev, workingDays: days.filter(d => d !== dayId) };
      } else {
        return { ...prev, workingDays: [...days, dayId].sort((a, b) => a - b) };
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings2 },
    { id: "bot", label: "Bot Configuration", icon: Bot },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "advanced", label: "Advanced", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Settings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Configure your Discord bot and notification preferences</p>
            </div>
            <Button 
              onClick={handleSave} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`button-tab-${tab.id}`}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
                
                <Separator className="my-4" />
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                      {user?.username}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs" data-testid="badge-role">
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings2 className="h-5 w-5" />
                    <span>General Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultTimezone">Default Timezone</Label>
                      <Select 
                        value={localSettings.defaultTimezone} 
                        onValueChange={(value) => setLocalSettings({...localSettings, defaultTimezone: value})}
                      >
                        <SelectTrigger data-testid="select-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="UTC+5">UTC+5 (PKT)</SelectItem>
                          <SelectItem value="EST">EST (UTC-5)</SelectItem>
                          <SelectItem value="PST">PST (UTC-8)</SelectItem>
                          <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                          <SelectItem value="JST">JST (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">User Interface</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Collect usage statistics and performance metrics
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.enableAnalytics}
                        onCheckedChange={(checked) => setLocalSettings({...localSettings, enableAnalytics: checked})}
                        data-testid="switch-analytics"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "bot" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>Bot Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={`p-4 rounded-lg ${botStatus?.isOnline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={botStatus?.isOnline 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                      }>
                        {botStatus?.isOnline ? 'Connected' : 'Not Connected'}
                      </Badge>
                      <span className="text-sm font-medium">
                        Bot Status: {botStatus?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {botStatus?.isOnline ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>Bot Name: <span className="font-medium">{botStatus.botName}</span></p>
                        <p>Connected Servers: <span className="font-medium">{botStatus.serverCount}</span></p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discord bot token is configured via environment secrets
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Prevent spam by limiting message frequency
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.rateLimitEnabled}
                        onCheckedChange={(checked) => setLocalSettings({...localSettings, rateLimitEnabled: checked})}
                        data-testid="switch-rate-limit"
                      />
                    </div>

                    {localSettings.rateLimitEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="maxMessagesPerMinute">Max Messages per Minute</Label>
                        <Input
                          id="maxMessagesPerMinute"
                          type="number"
                          min={1}
                          max={60}
                          value={localSettings.maxMessagesPerMinute}
                          onChange={(e) => setLocalSettings({...localSettings, maxMessagesPerMinute: parseInt(e.target.value) || 10})}
                          data-testid="input-max-messages"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Working Days</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Select which days count as working days for the "Working Days" repeat option
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DAYS_OF_WEEK.map((day) => (
                          <div 
                            key={day.id} 
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`day-${day.id}`}
                              checked={(localSettings.workingDays || []).includes(day.id)}
                              onCheckedChange={() => toggleWorkingDay(day.id)}
                              data-testid={`checkbox-day-${day.id}`}
                            />
                            <Label 
                              htmlFor={`day-${day.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notificationLimit">Maximum Active Notifications</Label>
                    <Input
                      id="notificationLimit"
                      type="number"
                      min={1}
                      max={100}
                      value={localSettings.notificationLimit}
                      onChange={(e) => setLocalSettings({...localSettings, notificationLimit: parseInt(e.target.value) || 50})}
                      data-testid="input-notification-limit"
                    />
                    <p className="text-sm text-muted-foreground">
                      Limit the number of active notifications per user
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Webhooks</Label>
                        <p className="text-sm text-muted-foreground">
                          Send webhook notifications for important events
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.enableWebhooks}
                        onCheckedChange={(checked) => setLocalSettings({...localSettings, enableWebhooks: checked})}
                        data-testid="switch-webhooks"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Keep your bot token secure and never share it publicly
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Log Level</Label>
                      <Select 
                        value={localSettings.logLevel} 
                        onValueChange={(value) => setLocalSettings({...localSettings, logLevel: value})}
                      >
                        <SelectTrigger data-testid="select-log-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "advanced" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Advanced Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="autoCleanupDays">Auto-cleanup Logs (Days)</Label>
                    <Input
                      id="autoCleanupDays"
                      type="number"
                      min={1}
                      max={365}
                      value={localSettings.autoCleanupDays}
                      onChange={(e) => setLocalSettings({...localSettings, autoCleanupDays: parseInt(e.target.value) || 30})}
                      data-testid="input-auto-cleanup"
                    />
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old notification logs after specified days
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Database Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Storage Type:</span>
                        <span className="ml-2">PostgreSQL</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Data Persistence:</span>
                        <span className="ml-2">Persistent</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Danger Zone</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        These actions cannot be undone
                      </p>
                      <Button variant="destructive" size="sm" data-testid="button-reset-settings">
                        Reset All Settings
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
