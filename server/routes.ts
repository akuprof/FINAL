import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDriverSchema,
  insertVehicleSchema,
  insertTripSchema,
  insertAssignmentSchema,
} from "@shared/schema";
import { z } from "zod";

// Payout calculation formula
function calculatePayout(revenue: number): number {
  return Math.min(revenue, 2250) * 0.30 + Math.max(revenue - 2250, 0) * 0.70;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get driver profile if user is a driver
      let driverProfile = null;
      if (user.role === 'driver') {
        driverProfile = await storage.getDriverByUserId(userId);
      }

      res.json({ ...user, driverProfile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Driver routes
  app.get('/api/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.post('/api/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  // Vehicle routes
  app.get('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Assignment routes
  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const assignmentData = insertAssignmentSchema.parse(req.body);
      
      // Deactivate existing assignment for the driver
      const existingAssignment = await storage.getActiveAssignmentByDriverId(assignmentData.driverId!);
      if (existingAssignment) {
        await storage.deactivateAssignment(existingAssignment.id);
      }

      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Trip routes
  app.get('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let trips;
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: "Driver profile not found" });
        }
        trips = await storage.getTripsByDriverId(driver.id);
      } else {
        trips = await storage.getAllTrips();
      }

      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found" });
      }

      // Get active assignment
      const assignment = await storage.getActiveAssignmentByDriverId(driver.id);
      if (!assignment) {
        return res.status(400).json({ message: "No active vehicle assignment found" });
      }

      const tripData = insertTripSchema.parse({
        ...req.body,
        driverId: driver.id,
        vehicleId: assignment.vehicleId,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
      });

      const trip = await storage.createTrip(tripData);

      // Create payout record
      const revenue = parseFloat(trip.revenue);
      const calculatedAmount = calculatePayout(revenue);

      await storage.createPayout({
        tripId: trip.id,
        driverId: driver.id,
        revenue: trip.revenue,
        calculatedAmount: calculatedAmount.toString(),
        status: 'pending',
      });

      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Payout routes
  app.get('/api/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let payouts;
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: "Driver profile not found" });
        }
        payouts = await storage.getPayoutsByDriverId(driver.id);
      } else {
        payouts = await storage.getPendingPayouts();
      }

      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.patch('/api/payouts/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { approvedAmount, notes } = req.body;

      const updatedPayout = await storage.updatePayout(id, {
        status: 'approved',
        approvedAmount: approvedAmount || undefined,
        approvedBy: user.id,
        approvedAt: new Date(),
        notes: notes || undefined,
      });

      res.json(updatedPayout);
    } catch (error) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Failed to approve payout" });
    }
  });

  app.patch('/api/payouts/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { notes } = req.body;

      const updatedPayout = await storage.updatePayout(id, {
        status: 'rejected',
        approvedBy: user.id,
        approvedAt: new Date(),
        notes: notes || undefined,
      });

      res.json(updatedPayout);
    } catch (error) {
      console.error("Error rejecting payout:", error);
      res.status(500).json({ message: "Failed to reject payout" });
    }
  });

  // Dashboard stats routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [drivers, vehicles, trips, pendingPayouts] = await Promise.all([
        storage.getAllDrivers(),
        storage.getAllVehicles(),
        storage.getAllTrips(),
        storage.getPendingPayouts(),
      ]);

      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTrips = trips.filter(trip => 
        trip.createdAt && new Date(trip.createdAt) >= today
      );
      const dailyRevenue = todayTrips.reduce((sum, trip) => sum + parseFloat(trip.revenue), 0);

      // Calculate pending payout amount
      const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => 
        sum + parseFloat(payout.calculatedAmount), 0
      );

      const stats = {
        activeDrivers: drivers.filter(d => d.isActive).length,
        fleetSize: vehicles.filter(v => v.status === 'active').length,
        dailyRevenue: dailyRevenue,
        pendingPayouts: pendingPayoutAmount,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Utility route for payout calculation
  app.post('/api/calculate-payout', (req, res) => {
    try {
      const { revenue } = req.body;
      const payout = calculatePayout(parseFloat(revenue) || 0);
      res.json({ payout, formula: `min(${revenue}, 2250) × 0.30 + max(${revenue} - 2250, 0) × 0.70` });
    } catch (error) {
      res.status(400).json({ message: "Invalid revenue amount" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
