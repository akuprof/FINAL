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

// Force complete redeploy - Supabase graceful fallback implementation
function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated && user ? (
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
      ) : (
        <Route path="/" component={Landing} />
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
