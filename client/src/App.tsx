import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import { AdminDashboard } from "./components/AdminDashboard";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { DriverDashboard } from "./components/DriverDashboard";
import { DriverManagement } from "./components/DriverManagement";

// Force redeploy with Supabase fix
function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route
            path="/admin"
            component={() =>
              user?.role === "admin" ? <AdminDashboard /> : <Home />
            }
          />
          <Route
            path="/drivers"
            component={() =>
              user?.role === "admin" ? <DriverManagement /> : <Home />
            }
          />
          {/* Add more protected routes here as needed */}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Toaster />
          <Router />
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
