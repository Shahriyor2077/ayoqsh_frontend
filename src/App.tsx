import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import OperatorPanel from "@/pages/operator-panel";
import UsersPage from "@/pages/users";
import StationsPage from "@/pages/stations";
import ChecksPage from "@/pages/checks";
import MessagesPage from "@/pages/messages";
import CustomersReportPage from "@/pages/customers-report";
import PendingChecksPage from "@/pages/pending-checks";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "operator") return <OperatorPanel />;
    if (user.role === "moderator") return <AdminDashboard />;
    return <div className="p-8 text-center">Ruxsat yo'q</div>;
  }

  return <Component />;
}

function RoleBasedHome() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role === "moderator") return <AdminDashboard />;
  if (user.role === "operator") return <OperatorPanel />;

  return <div className="p-8 text-center">Mijoz paneli (Telegram bot orqali)</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route path="/">
        <Layout>
          <RoleBasedHome />
        </Layout>
      </Route>

      <Route path="/users">
        <Layout>
          <ProtectedRoute component={UsersPage} allowedRoles={["moderator"]} />
        </Layout>
      </Route>

      <Route path="/stations">
        <Layout>
          <ProtectedRoute component={StationsPage} allowedRoles={["moderator"]} />
        </Layout>
      </Route>

      <Route path="/checks">
        <Layout>
          <ProtectedRoute component={ChecksPage} allowedRoles={["moderator"]} />
        </Layout>
      </Route>

      <Route path="/messages">
        <Layout>
          <ProtectedRoute component={MessagesPage} allowedRoles={["moderator"]} />
        </Layout>
      </Route>

      <Route path="/customers-report">
        <Layout>
          <ProtectedRoute component={CustomersReportPage} allowedRoles={["moderator"]} />
        </Layout>
      </Route>

      <Route path="/history">
        <Layout>
          <ProtectedRoute component={ChecksPage} allowedRoles={["operator", "moderator"]} />
        </Layout>
      </Route>

      <Route path="/pending-checks">
        <Layout>
          <ProtectedRoute component={PendingChecksPage} allowedRoles={["operator", "moderator"]} />
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
