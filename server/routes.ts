import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDriverSchema,
  insertVehicleSchema,
  insertTripSchema,
  insertAssignmentSchema,
  insertFuelStationSchema,
  insertFuelRecordSchema,
  insertDriverChecklistSchema,
  insertChecklistItemSchema,
  insertMaintenanceRecordSchema,
  insertMaintenanceTaskSchema,
  insertInventoryItemSchema,
  insertDocumentSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";

// Payout calculation formula
function calculatePayout(revenue: number): number {
  return Math.min(revenue, 2250) * 0.30 + Math.max(revenue - 2250, 0) * 0.70;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

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

  // Users routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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

  // Fuel station routes
  app.get('/api/fuel-stations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const fuelStations = await storage.getAllFuelStations();
      res.json(fuelStations);
    } catch (error) {
      console.error("Error fetching fuel stations:", error);
      res.status(500).json({ message: "Failed to fetch fuel stations" });
    }
  });

  app.post('/api/fuel-stations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const fuelStationData = insertFuelStationSchema.parse(req.body);
      const fuelStation = await storage.createFuelStation(fuelStationData);
      res.status(201).json(fuelStation);
    } catch (error) {
      console.error("Error creating fuel station:", error);
      res.status(500).json({ message: "Failed to create fuel station" });
    }
  });

  // Fuel record routes
  app.get('/api/fuel-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let fuelRecords;
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: "Driver profile not found" });
        }
        fuelRecords = await storage.getFuelRecordsByDriverId(driver.id);
      } else {
        fuelRecords = await storage.getAllFuelRecords();
      }

      res.json(fuelRecords);
    } catch (error) {
      console.error("Error fetching fuel records:", error);
      res.status(500).json({ message: "Failed to fetch fuel records" });
    }
  });

  app.post('/api/fuel-records', isAuthenticated, async (req: any, res) => {
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

      const fuelRecordData = insertFuelRecordSchema.parse({
        ...req.body,
        driverId: driver.id,
        vehicleId: assignment.vehicleId,
      });

      const fuelRecord = await storage.createFuelRecord(fuelRecordData);
      res.status(201).json(fuelRecord);
    } catch (error) {
      console.error("Error creating fuel record:", error);
      res.status(500).json({ message: "Failed to create fuel record" });
    }
  });

  // Driver checklist routes
  app.get('/api/checklists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let checklists;
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(404).json({ message: "Driver profile not found" });
        }
        checklists = await storage.getChecklistsByDriverId(driver.id);
      } else {
        // For admin/manager, get all checklists - would need to add this method
        checklists = [];
      }

      res.json(checklists);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ message: "Failed to fetch checklists" });
    }
  });

  app.post('/api/checklists', isAuthenticated, async (req: any, res) => {
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

      const checklistData = insertDriverChecklistSchema.parse({
        ...req.body,
        driverId: driver.id,
        vehicleId: assignment.vehicleId,
      });

      const checklist = await storage.createDriverChecklist(checklistData);
      res.status(201).json(checklist);
    } catch (error) {
      console.error("Error creating checklist:", error);
      res.status(500).json({ message: "Failed to create checklist" });
    }
  });

  app.patch('/api/checklists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = {
        ...req.body,
        completedAt: req.body.status === 'completed' ? new Date() : undefined,
      };

      const updatedChecklist = await storage.updateDriverChecklist(id, updates);
      res.json(updatedChecklist);
    } catch (error) {
      console.error("Error updating checklist:", error);
      res.status(500).json({ message: "Failed to update checklist" });
    }
  });

  // Checklist items routes
  app.get('/api/checklists/:checklistId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { checklistId } = req.params;
      const items = await storage.getChecklistItemsByChecklistId(checklistId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ message: "Failed to fetch checklist items" });
    }
  });

  app.post('/api/checklists/:checklistId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { checklistId } = req.params;
      const itemData = insertChecklistItemSchema.parse({
        ...req.body,
        checklistId,
      });

      const item = await storage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating checklist item:", error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });

  app.patch('/api/checklist-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedItem = await storage.updateChecklistItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  // Maintenance record routes
  app.get('/api/maintenance', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const maintenanceRecords = await storage.getAllMaintenanceRecords();
      res.json(maintenanceRecords);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ message: "Failed to fetch maintenance records" });
    }
  });

  app.post('/api/maintenance', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const maintenanceData = insertMaintenanceRecordSchema.parse(req.body);
      const maintenanceRecord = await storage.createMaintenanceRecord(maintenanceData);
      res.status(201).json(maintenanceRecord);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(500).json({ message: "Failed to create maintenance record" });
    }
  });

  app.patch('/api/maintenance/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const updates = {
        ...req.body,
        completedDate: req.body.status === 'completed' ? new Date() : undefined,
      };

      const updatedRecord = await storage.updateMaintenanceRecord(id, updates);
      res.json(updatedRecord);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(500).json({ message: "Failed to update maintenance record" });
    }
  });

  // Maintenance task routes
  app.get('/api/maintenance/:recordId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { recordId } = req.params;
      const tasks = await storage.getMaintenanceTasksByRecordId(recordId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      res.status(500).json({ message: "Failed to fetch maintenance tasks" });
    }
  });

  app.post('/api/maintenance/:recordId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { recordId } = req.params;
      const taskData = insertMaintenanceTaskSchema.parse({
        ...req.body,
        maintenanceRecordId: recordId,
      });

      const task = await storage.createMaintenanceTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating maintenance task:", error);
      res.status(500).json({ message: "Failed to create maintenance task" });
    }
  });

  app.patch('/api/maintenance-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const updatedTask = await storage.updateMaintenanceTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating maintenance task:", error);
      res.status(500).json({ message: "Failed to update maintenance task" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const inventoryItems = await storage.getAllInventoryItems();
      res.json(inventoryItems);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const inventoryData = insertInventoryItemSchema.parse(req.body);
      const inventoryItem = await storage.createInventoryItem(inventoryData);
      res.status(201).json(inventoryItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const updatedItem = await storage.updateInventoryItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Document upload route
  app.post('/api/documents/upload', isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const { entityId, entityType, documentType } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const documents = [];
      for (const file of files) {
        const document = await storage.createDocument({
          entityId,
          entityType,
          documentType,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
        });
        documents.push(document);
      }

      res.status(201).json({ documents });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  // Get documents by entity
  app.get('/api/documents/:entityType/:entityId', isAuthenticated, async (req: any, res) => {
    try {
      const { entityId, entityType } = req.params;
      const documents = await storage.getDocumentsByEntity(entityId, entityType);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // View document
  app.get('/api/documents/:id/view', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      const fileExists = existsSync(document.filePath);
      if (!fileExists) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Set appropriate content type
      const ext = path.extname(document.fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.pdf') contentType = 'application/pdf';
      else if (['.doc', '.docx'].includes(ext)) contentType = 'application/msword';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
      res.sendFile(path.resolve(document.filePath));
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Download document
  app.get('/api/documents/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      const fileExists = existsSync(document.filePath);
      if (!fileExists) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.sendFile(path.resolve(document.filePath));
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from disk
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn("File not found on disk, continuing with database deletion");
      }

      // Delete from database
      await storage.deleteDocument(id);
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
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
