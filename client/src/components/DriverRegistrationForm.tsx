
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDriverSchema, type InsertDriver } from "@shared/schema";
import { UserPlus, Save, X } from "lucide-react";

interface DriverRegistrationFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function DriverRegistrationForm({ onClose, onSuccess }: DriverRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<InsertDriver>>({
    employeeId: '',
    phoneNumber: '',
    address: '',
    licenseNumber: '',
    emergencyContact: '',
    isActive: true,
  });

  // Get users who don't have driver profiles yet
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: existingDrivers } = useQuery({
    queryKey: ["/api/drivers"],
    retry: false,
  });

  const createDriverMutation = useMutation({
    mutationFn: async (data: InsertDriver) => {
      const validatedData = insertDriverSchema.parse(data);
      return await apiRequest("POST", "/api/drivers", validatedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver registered successfully",
      });
      setFormData({
        employeeId: '',
        phoneNumber: '',
        address: '',
        licenseNumber: '',
        emergencyContact: '',
        isActive: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register driver",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.employeeId || !formData.licenseNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createDriverMutation.mutate(formData as InsertDriver);
  };

  const handleInputChange = (field: keyof InsertDriver, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter users who don't already have driver profiles
  const availableUsers = users?.filter((user: any) => 
    !existingDrivers?.find((driver: any) => driver.userId === user.id)
  ) || [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>Register New Driver</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="userId">Select User *</Label>
            <Select
              value={formData.userId || ""}
              onValueChange={(value) => handleInputChange('userId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to register as driver" />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                ) : availableUsers.length === 0 ? (
                  <SelectItem value="none" disabled>No available users</SelectItem>
                ) : (
                  availableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Employee ID */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input
              id="employeeId"
              type="text"
              value={formData.employeeId}
              onChange={(e) => handleInputChange('employeeId', e.target.value)}
              placeholder="Enter unique employee ID"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {/* License Number */}
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input
              id="licenseNumber"
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="Enter driving license number"
              required
            />
          </div>

          {/* License Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
            <Input
              id="licenseExpiryDate"
              type="date"
              value={formData.licenseExpiryDate ? new Date(formData.licenseExpiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('licenseExpiryDate', e.target.value ? new Date(e.target.value) : '')}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : '')}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter full address"
              rows={3}
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              type="tel"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              placeholder="Enter emergency contact number"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            {onClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createDriverMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={createDriverMutation.isPending}
              className="bg-primary hover:bg-primary-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {createDriverMutation.isPending ? "Registering..." : "Register Driver"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
