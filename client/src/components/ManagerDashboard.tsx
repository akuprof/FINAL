import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingPayouts, isLoading } = useQuery({
    queryKey: ["/api/payouts"],
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

  const approveMutation = useMutation({
    mutationFn: async ({ payoutId }: { payoutId: string }) => {
      await apiRequest("PATCH", `/api/payouts/${payoutId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
      toast({
        title: "Success",
        description: "Payout approved successfully",
      });
    },
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve payout",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ payoutId, notes }: { payoutId: string; notes: string }) => {
      await apiRequest("PATCH", `/api/payouts/${payoutId}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
      toast({
        title: "Success",
        description: "Payout rejected",
      });
    },
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject payout",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (payoutId: string) => {
    approveMutation.mutate({ payoutId });
  };

  const handleReject = (payoutId: string) => {
    const notes = prompt("Enter rejection reason (optional):");
    rejectMutation.mutate({ payoutId, notes: notes || "" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Operations Management</h1>
          <p className="text-gray-600">Monitor daily operations and manage driver performance</p>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingPayoutsList = pendingPayouts?.filter((payout: any) => payout.status === 'pending') || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Operations Management</h1>
        <p className="text-gray-600">Monitor daily operations and manage driver performance</p>
      </div>

      {/* Payout Approval Section */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Payout Approvals</h3>
        </div>
        <CardContent className="p-6">
          {pendingPayoutsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending payouts for approval
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayoutsList.map((payout: any, index: number) => (
                <div 
                  key={payout.id} 
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  data-testid={`payout-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      D{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Driver {index + 1}</div>
                      <div className="text-sm text-gray-500">
                        Trip Revenue: <span>₹{parseFloat(payout.revenue).toLocaleString()}</span> • 
                        Calculated Payout: <span>₹{parseFloat(payout.calculatedAmount).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Formula: min({payout.revenue}, 2250) × 0.30 + max({payout.revenue} - 2250, 0) × 0.70 = ₹{parseFloat(payout.calculatedAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(payout.id)}
                      disabled={approveMutation.isPending}
                      className="bg-success hover:bg-green-600 text-white"
                      data-testid={`approve-payout-${index}`}
                    >
                      <i className="fas fa-check mr-1"></i>
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(payout.id)}
                      disabled={rejectMutation.isPending}
                      variant="destructive"
                      data-testid={`reject-payout-${index}`}
                    >
                      <i className="fas fa-times mr-1"></i>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers This Week</h3>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Performance data will be available once drivers start logging trips
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Utilization</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Vehicles</span>
                <span className="text-sm font-semibold text-gray-900">-/-</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Maintenance Due</span>
                <span className="text-sm font-semibold text-warning">0 vehicles</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
