import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripLogForm } from "./TripLogForm";
import { FuelRecordForm } from "./FuelRecordForm";
import { DriverChecklist } from "./DriverChecklist";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User } from "@shared/schema";
import { Fuel, ClipboardList, Car, DollarSign, Plus } from "lucide-react";
import { useState } from "react";

interface DriverDashboardProps {
  user: User;
}

export function DriverDashboard({ user }: DriverDashboardProps) {
  const { toast } = useToast();
  const [showTripForm, setShowTripForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklists' | 'fuel'>('overview');

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

  const { data: fuelRecords, isLoading: fuelRecordsLoading } = useQuery({
    queryKey: ["/api/fuel-records"],
    retry: false,
  });

  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ["/api/checklists"],
    retry: false,
  });

  // Calculate today's earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrips = (trips || []).filter((trip: any) => 
    new Date(trip.createdAt) >= today
  );
  
  const todayPayouts = (payouts || []).filter((payout: any) => {
    const payoutDate = new Date(payout.createdAt);
    payoutDate.setHours(0, 0, 0, 0);
    return payoutDate >= today;
  });

  const todayEarnings = todayPayouts.reduce((sum: number, payout: any) => 
    sum + parseFloat(payout.calculatedAmount), 0
  );

  const target = 2000;
  const progressPercent = Math.min((todayEarnings / target) * 100, 100);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName || "";
    const last = lastName || "";
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || "D";
  };

  const getDisplayName = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return user.email || "Driver";
  };

  if (tripsLoading || payoutsLoading || fuelRecordsLoading || checklistsLoading) {
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

  const recentTrips = (trips || []).slice(0, 5);

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

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex-1"
          data-testid="tab-overview"
        >
          <Car className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'fuel' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('fuel')}
          className="flex-1"
          data-testid="tab-fuel"
        >
          <Fuel className="h-4 w-4 mr-2" />
          Fuel
        </Button>
        <Button
          variant={activeTab === 'checklists' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('checklists')}
          className="flex-1"
          data-testid="tab-checklists"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Checklists
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <TripLogForm />
          
          {/* Recent Trips */}
          <Card className="mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Recent Trips</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-8 text-center text-gray-500">
                No trips logged yet. Start by logging your first trip above!
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div>
          <FuelRecordForm />
          
          {/* Recent Fuel Records */}
          <Card className="mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Fuel Records</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-8 text-center text-gray-500">
                No fuel records yet. Start by logging your first fuel entry above!
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'checklists' && (
        <div>
          <DriverChecklist />
        </div>
      )}
    </div>
  );
}
