import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Settings2, 
  Bot, 
  Bell, 
  Shield, 
  Clock, 
  Globe, 
  Database,
  User,
  Save,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    botName: "Discord Scheduler Bot",
    defaultTimezone: "UTC",
    notificationLimit: 50,
    enableWebhooks: true,
    autoCleanupDays: 30,
    rateLimitEnabled: true,
    maxMessagesPerMinute: 10,
    enableAnalytics: true,
    logLevel: "info",
  });
  const { toast } = useToast();

  const handleSave = () => {
    console.log("Settings saved:", settings);
    toast({
      title: "Settings Saved",
      description: "Your bot settings have been updated successfully.",
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Configure your Discord bot and notification preferences</p>
            </div>
            <Button onClick={handleSave} className="discord-primary discord-primary-hover text-white">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* General Settings */}
              {activeTab === "general" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>General Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="botName">Bot Display Name</Label>
                        <Input
                          id="botName"
                          value={settings.botName}
                          onChange={(e) => setSettings({...settings, botName: e.target.value})}
                          placeholder="Discord Scheduler Bot"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultTimezone">Default Timezone</Label>
                        <Select value={settings.defaultTimezone} onValueChange={(value) => setSettings({...settings, defaultTimezone: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
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
                          checked={settings.enableAnalytics}
                          onCheckedChange={(checked) => setSettings({...settings, enableAnalytics: checked})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bot Configuration */}
              {activeTab === "bot" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-5 w-5" />
                      <span>Bot Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Connected
                        </Badge>
                        <span className="text-sm font-medium">Bot Status: Online</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your bot is successfully connected and running
                      </p>
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
                          checked={form.watch("rateLimitEnabled")}
                          onCheckedChange={(checked) => form.setValue("rateLimitEnabled", checked)}
                        />
                      </div>

                      {form.watch("rateLimitEnabled") && (
                        <div className="space-y-2">
                          <Label htmlFor="maxMessagesPerMinute">Max Messages per Minute</Label>
                          <Input
                            id="maxMessagesPerMinute"
                            type="number"
                            min="1"
                            max="60"
                            {...form.register("maxMessagesPerMinute", { valueAsNumber: true })}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="notificationLimit">Maximum Active Notifications</Label>
                      <Input
                        id="notificationLimit"
                        type="number"
                        min="1"
                        max="100"
                        {...form.register("notificationLimit", { valueAsNumber: true })}
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
                          checked={form.watch("enableWebhooks")}
                          onCheckedChange={(checked) => form.setValue("enableWebhooks", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security */}
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
                        <Select value={form.watch("logLevel")} onValueChange={(value: "debug" | "info" | "warn" | "error") => form.setValue("logLevel", value)}>
                          <SelectTrigger>
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

              {/* Advanced */}
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
                        min="1"
                        max="365"
                        {...form.register("autoCleanupDays", { valueAsNumber: true })}
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
                          <span className="ml-2">In-Memory (Development)</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Data Persistence:</span>
                          <span className="ml-2">Session Only</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Danger Zone</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        These actions cannot be undone
                      </p>
                      <Button variant="destructive" size="sm">
                        Reset All Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}