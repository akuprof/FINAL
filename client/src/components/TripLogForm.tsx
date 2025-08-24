import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ImageUploader } from "./ImageUploader";

export function TripLogForm() {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropLocation: "",
    revenue: "",
    distance: "",
  });
  const [calculatedPayout, setCalculatedPayout] = useState<number>(0);
  const [payoutFormula, setPayoutFormula] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time payout calculation
  const { mutate: calculatePayout } = useMutation({
    mutationFn: async (revenue: number) => {
      const response = await apiRequest("POST", "/api/calculate-payout", { revenue });
      return response.json();
    },
    onSuccess: (data) => {
      setCalculatedPayout(data.payout);
      setPayoutFormula(data.formula);
    },
    onError: () => {
      setCalculatedPayout(0);
      setPayoutFormula("");
    },
  });

  const tripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      await apiRequest("POST", "/api/trips", tripData);
    },
    onSuccess: () => {
      // Reset form
      setFormData({
        pickupLocation: "",
        dropLocation: "",
        revenue: "",
        distance: "",
      });
      setCalculatedPayout(0);
      setPayoutFormula("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
      
      toast({
        title: "Success",
        description: "Trip logged successfully! Your payout is being processed.",
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
        description: "Failed to log trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Calculate payout in real-time when revenue changes
    if (field === "revenue" && value) {
      const revenue = parseFloat(value);
      if (!isNaN(revenue) && revenue > 0) {
        calculatePayout(revenue);
      } else {
        setCalculatedPayout(0);
        setPayoutFormula("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.pickupLocation || !formData.dropLocation || !formData.revenue) {
      toast({
        title: "Validation Error",
        description: "Please fill in pickup location, drop location, and revenue.",
        variant: "destructive",
      });
      return;
    }

    const revenue = parseFloat(formData.revenue);
    if (isNaN(revenue) || revenue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid revenue amount.",
        variant: "destructive",
      });
      return;
    }

    tripMutation.mutate({
      pickupLocation: formData.pickupLocation,
      dropLocation: formData.dropLocation,
      revenue: revenue.toString(),
      distance: formData.distance ? parseFloat(formData.distance).toString() : null,
    });
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Log New Trip</h3>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location
              </Label>
              <Input
                id="pickupLocation"
                type="text"
                placeholder="Enter pickup location"
                value={formData.pickupLocation}
                onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
                className="text-base"
                data-testid="input-pickup-location"
              />
            </div>
            
            <div>
              <Label htmlFor="dropLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Drop Location
              </Label>
              <Input
                id="dropLocation"
                type="text"
                placeholder="Enter drop location"
                value={formData.dropLocation}
                onChange={(e) => handleInputChange("dropLocation", e.target.value)}
                className="text-base"
                data-testid="input-drop-location"
              />
            </div>
            
            <div>
              <Label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Revenue (₹)
              </Label>
              <Input
                id="revenue"
                type="number"
                placeholder="Enter trip revenue"
                value={formData.revenue}
                onChange={(e) => handleInputChange("revenue", e.target.value)}
                className="text-base"
                min="0"
                step="0.01"
                data-testid="input-revenue"
              />
            </div>
            
            <div>
              <Label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Distance (km) - Optional
              </Label>
              <Input
                id="distance"
                type="number"
                placeholder="Enter distance"
                value={formData.distance}
                onChange={(e) => handleInputChange("distance", e.target.value)}
                className="text-base"
                min="0"
                step="0.1"
                data-testid="input-distance"
              />
            </div>
          </div>
          
          {/* Payout Calculation Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Calculated Payout</div>
            <div className="text-xl font-semibold text-success" data-testid="calculated-payout">
              ₹{calculatedPayout.toLocaleString()}
            </div>
            {payoutFormula && (
              <div className="text-xs text-gray-500 mt-1" data-testid="payout-formula">
                {payoutFormula}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={tripMutation.isPending}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            data-testid="button-submit-trip"
          >
            {tripMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Logging Trip...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Log Trip
              </>
            )}
          </Button>
        </form>

        {/* Image Upload Section */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Attach Trip Documents/Images
          </h4>
          <ImageUploader
            entityId="temp-trip"
            entityType="trip"
            documentType="trip-document"
            maxFiles={5}
            acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
          />
        </div>
      </CardContent>
    </Card>
  );
}
