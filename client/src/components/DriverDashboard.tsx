import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TripLogForm } from "./TripLogForm";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User } from "@shared/schema";

interface DriverDashboardProps {
  user: User;
}

export function DriverDashboard({ user }: DriverDashboardProps) {
  const { toast } = useToast();

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

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["/api/payouts"],
    retry: false,
  });

  // Calculate today's earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrips = trips?.filter((trip: any) => 
    new Date(trip.createdAt) >= today
  ) || [];
  
  const todayPayouts = payouts?.filter((payout: any) => {
    const payoutDate = new Date(payout.createdAt);
    payoutDate.setHours(0, 0, 0, 0);
    return payoutDate >= today;
  }) || [];

  const todayEarnings = todayPayouts.reduce((sum: number, payout: any) => 
    sum + parseFloat(payout.calculatedAmount), 0
  );

  const target = 2000;
  const progressPercent = Math.min((todayEarnings / target) * 100, 100);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName || "";
    const last = lastName || "";
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || "D";
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return user.email || "Driver";
  };

  if (tripsLoading || payoutsLoading) {
    return (
      <div className="max-w-md mx-auto lg:max-w-none space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const recentTrips = trips?.slice(0, 5) || [];

  return (
    <div className="max-w-md mx-auto lg:max-w-none">
      {/* Driver Info Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900" data-testid="driver-name">
                {getDisplayName(user.firstName, user.lastName)}
              </h2>
              <p className="text-gray-600">Driver ID: {user.id.slice(0, 8)}</p>
              <p className="text-sm text-success">On Duty</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Earnings */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg text-white p-6 mb-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Today's Earnings</h3>
          <div className="text-3xl font-bold mb-2" data-testid="today-earnings">
            ₹{todayEarnings.toLocaleString()}
          </div>
          <div className="text-sm opacity-90">
            Target: <span data-testid="target-earnings">₹{target.toLocaleString()}</span> • 
            Progress: <span data-testid="progress-percent">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2 mt-3">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          className="bg-success text-white p-4 rounded-lg text-center hover:bg-green-600 transition-colors"
          onClick={() => document.getElementById('trip-form')?.scrollIntoView({ behavior: 'smooth' })}
          data-testid="quick-action-log-trip"
        >
          <i className="fas fa-plus-circle text-2xl mb-2"></i>
          <div className="font-medium">Log Trip</div>
        </button>
        <button 
          className="bg-warning text-white p-4 rounded-lg text-center hover:bg-yellow-600 transition-colors"
          data-testid="quick-action-view-earnings"
        >
          <i className="fas fa-chart-line text-2xl mb-2"></i>
          <div className="font-medium">Earnings</div>
        </button>
      </div>

      {/* Trip Logging Form */}
      <div id="trip-form">
        <TripLogForm />
      </div>

      {/* Recent Trips */}
      <Card className="mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Recent Trips</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTrips.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No trips logged yet. Start by logging your first trip above!
            </div>
          ) : (
            recentTrips.map((trip: any, index: number) => {
              const matchingPayout = payouts?.find((payout: any) => payout.tripId === trip.id);
              
              return (
                <div key={trip.id} className="p-4" data-testid={`trip-${index}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {trip.pickupLocation} → {trip.dropLocation}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(trip.createdAt).toLocaleDateString()} at{" "}
                        {new Date(trip.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₹{matchingPayout ? parseFloat(matchingPayout.calculatedAmount).toLocaleString() : 'Calculating...'}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        matchingPayout?.status === 'approved' 
                          ? 'bg-green-100 text-success'
                          : matchingPayout?.status === 'rejected'
                          ? 'bg-red-100 text-error'
                          : 'bg-yellow-100 text-warning'
                      }`}>
                        {matchingPayout?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: ₹{parseFloat(trip.revenue).toLocaleString()}
                    {trip.distance && ` • Distance: ${trip.distance} km`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
