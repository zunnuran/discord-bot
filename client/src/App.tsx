import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import CreateNotification from "@/pages/create-notification";
import Notifications from "@/pages/notifications";
import EditNotification from "@/pages/edit-notification";
import Servers from "@/pages/servers";
import Analytics from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import ServerDetails from "@/pages/server-details";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/create">
        <ProtectedRoute>
          <CreateNotification />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications/:id/edit">
        <ProtectedRoute>
          <EditNotification />
        </ProtectedRoute>
      </Route>
      <Route path="/servers">
        <ProtectedRoute>
          <Servers />
        </ProtectedRoute>
      </Route>
      <Route path="/servers/:serverId">
        <ProtectedRoute>
          <ServerDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
