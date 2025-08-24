import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFuelRecordSchema, type InsertFuelRecord } from "@shared/schema";
import { Fuel } from "lucide-react";

export function FuelRecordForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fuelStations, isLoading: stationsLoading } = useQuery({
    queryKey: ["/api/fuel-stations"],
    retry: false,
  });

  const form = useForm<InsertFuelRecord>({
    resolver: zodResolver(insertFuelRecordSchema.omit({ driverId: true, vehicleId: true, createdAt: true })),
    defaultValues: {
      refuelDate: new Date(),
      fuelType: "petrol",
      recordType: "refuel",
      quantity: "0",
      pricePerLiter: "0",
      totalCost: "0",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertFuelRecord) => {
      await apiRequest("POST", "/api/fuel-records", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fuel record logged successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-records"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log fuel record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFuelRecord) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Log Fuel Record
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fuelStationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Station</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-fuel-station">
                        <SelectValue placeholder="Select fuel station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stationsLoading ? (
                        <SelectItem value="loading">Loading stations...</SelectItem>
                      ) : (
                        (fuelStations || []).map((station: any) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name} - {station.location}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-fuel-type">
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refuelDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refuel Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-refuel-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (Liters)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value || "")}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerLiter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Liter (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value || "")}
                        data-testid="input-price-per-liter"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      data-testid="input-total-cost"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="odometerReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odometer Reading (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-odometer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
              data-testid="button-submit-fuel-record"
            >
              {mutation.isPending ? "Logging..." : "Log Fuel Record"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}