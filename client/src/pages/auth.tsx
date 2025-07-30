import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Calendar, Bot } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();

  const handleDiscordAuth = () => {
    // For development, simulate auth and redirect
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 discord-primary rounded-2xl flex items-center justify-center">
              <div className="flex items-center space-x-1">
                <Calendar className="h-6 w-6 text-white" />
                <Bot className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Discord Scheduler</CardTitle>
          <CardDescription>
            Sign in with Discord to manage your bot notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleDiscordAuth}
            className="w-full discord-primary discord-primary-hover text-white"
            size="lg"
          >
            <Bot className="mr-2 h-5 w-5" />
            Continue with Discord
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
