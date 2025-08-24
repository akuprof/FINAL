import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DashboardStats {
  activeDrivers: number;
  fleetSize: number;
  dailyRevenue: number;
  pendingPayouts: number;
}

export function AdminDashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips"],
    retry: false,
    meta: {
      onError: (error: Error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
      },
    },
  });

  if (statsLoading || tripsLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Fleet Management Overview</h1>
          <p className="text-gray-600">Monitor your fleet operations and performance metrics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentTrips = trips?.slice(0, 5) || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Fleet Management Overview</h1>
        <p className="text-gray-600">Monitor your fleet operations and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-active-drivers">
                  {stats?.activeDrivers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-primary text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success">+12%</span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Size</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-fleet-size">
                  {stats?.fleetSize || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-car text-success text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success">+2</span>
              <span className="text-gray-500 ml-2">new vehicles</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-daily-revenue">
                  ₹{stats?.dailyRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-warning text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success">+8%</span>
              <span className="text-gray-500 ml-2">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-pending-payouts">
                  ₹{stats?.pendingPayouts?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-circle text-error text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">requiring approval</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Trips */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Trips</h3>
            </div>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTrips.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No trips found
                        </td>
                      </tr>
                    ) : (
                      recentTrips.map((trip: any, index: number) => (
                        <tr key={trip.id} data-testid={`trip-row-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                D{index + 1}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">Driver {index + 1}</div>
                                <div className="text-sm text-gray-500">Vehicle Info</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {trip.pickupLocation} → {trip.dropLocation}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(trip.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{parseFloat(trip.revenue).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trip.status === 'completed' 
                                ? 'bg-green-100 text-success' 
                                : 'bg-yellow-100 text-warning'
                            }`}>
                              {trip.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="action-add-driver"
                onClick={() => window.location.href = "/drivers"}
              >
                <i className="fas fa-user-plus mr-3 text-primary"></i>
                Manage Drivers
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="action-register-vehicle"
              >
                <i className="fas fa-plus-circle mr-3 text-primary"></i>
                Register Vehicle
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="action-generate-report"
              >
                <i className="fas fa-chart-bar mr-3 text-primary"></i>
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="action-approve-payouts"
              >
                <i className="fas fa-check-circle mr-3 text-primary"></i>
                Approve Payouts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
