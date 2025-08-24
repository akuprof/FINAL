
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverRegistrationForm } from "./DriverRegistrationForm";
import { Plus, Users, Car, Phone, Calendar } from "lucide-react";

export function DriverManagement() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers"],
    retry: false,
  });

  if (showRegistrationForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Driver Management</h2>
            <p className="text-gray-600">Register and manage fleet drivers</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowRegistrationForm(false)}
          >
            Back to List
          </Button>
        </div>
        
        <DriverRegistrationForm
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={() => setShowRegistrationForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">Manage your fleet drivers and their information</p>
        </div>
        <Button
          onClick={() => setShowRegistrationForm(true)}
          className="bg-primary hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Driver
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {drivers?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {drivers?.filter((d: any) => d.isActive).length || 0}
                </p>
              </div>
              <Car className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {drivers?.filter((d: any) => !d.isActive).length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {driversLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : drivers?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers registered</h3>
              <p className="text-gray-600 mb-4">Start by registering your first driver</p>
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="bg-primary hover:bg-primary-dark"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register First Driver
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers?.map((driver: any) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                            {driver.user?.firstName?.[0] || 'D'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.user?.firstName} {driver.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {driver.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.licenseNumber}</div>
                        {driver.licenseExpiryDate && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {driver.phoneNumber ? (
                          <div className="text-sm text-gray-900 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {driver.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No phone</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={driver.isActive ? "default" : "secondary"}
                          className={driver.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {driver.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
