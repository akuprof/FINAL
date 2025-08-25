import {
  users,
  drivers,
  vehicles,
  trips,
  payouts,
  assignments,
  incidents,
  documents,
  fuelStations,
  fuelRecords,
  driverChecklists,
  checklistItems,
  maintenanceRecords,
  maintenanceTasks,
  inventoryItems,
  type User,
  type UpsertUser,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type Trip,
  type InsertTrip,
  type Payout,
  type InsertPayout,
  type Assignment,
  type InsertAssignment,
  type Incident,
  type InsertIncident,
  type Document,
  type InsertDocument,
  type FuelStation,
  type InsertFuelStation,
  type FuelRecord,
  type InsertFuelRecord,
  type DriverChecklist,
  type InsertDriverChecklist,
  type ChecklistItem,
  type InsertChecklistItem,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type MaintenanceTask,
  type InsertMaintenanceTask,
  type InventoryItem,
  type InsertInventoryItem,
} from "@shared/schema";
import { db, supabase } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import type { UploadedFile } from 'express-fileupload';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Driver operations
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;
  getAllDrivers(): Promise<Driver[]>;

  // Vehicle operations
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle>;
  getAllVehicles(): Promise<Vehicle[]>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getActiveAssignmentByDriverId(driverId: string): Promise<Assignment | undefined>;
  deactivateAssignment(assignmentId: string): Promise<void>;

  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip>;
  getTripsByDriverId(driverId: string): Promise<Trip[]>;
  getAllTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | undefined>;

  // Payout operations
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: string, updates: Partial<InsertPayout>): Promise<Payout>;
  getPendingPayouts(): Promise<Payout[]>;
  getPayoutsByDriverId(driverId: string): Promise<Payout[]>;

  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getAllIncidents(): Promise<Incident[]>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByEntity(entityId: string, entityType: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  uploadFile(file: Buffer, path: string): Promise<string>;

  // Fuel station operations
  createFuelStation(fuelStation: InsertFuelStation): Promise<FuelStation>;
  getAllFuelStations(): Promise<FuelStation[]>;
  updateFuelStation(id: string, updates: Partial<InsertFuelStation>): Promise<FuelStation>;

  // Fuel record operations
  createFuelRecord(fuelRecord: InsertFuelRecord): Promise<FuelRecord>;
  getFuelRecordsByVehicleId(vehicleId: string): Promise<FuelRecord[]>;
  getFuelRecordsByDriverId(driverId: string): Promise<FuelRecord[]>;
  getAllFuelRecords(): Promise<FuelRecord[]>;

  // Driver checklist operations
  createDriverChecklist(checklist: InsertDriverChecklist): Promise<DriverChecklist>;
  getChecklistsByDriverId(driverId: string): Promise<DriverChecklist[]>;
  updateDriverChecklist(id: string, updates: Partial<InsertDriverChecklist>): Promise<DriverChecklist>;

  // Checklist item operations
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  getChecklistItemsByChecklistId(checklistId: string): Promise<ChecklistItem[]>;
  updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem>;

  // Maintenance record operations
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  getMaintenanceRecordsByVehicleId(vehicleId: string): Promise<MaintenanceRecord[]>;
  getAllMaintenanceRecords(): Promise<MaintenanceRecord[]>;
  updateMaintenanceRecord(id: string, updates: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord>;

  // Maintenance task operations
  createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask>;
  getMaintenanceTasksByRecordId(recordId: string): Promise<MaintenanceTask[]>;
  updateMaintenanceTask(id: string, updates: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask>;

  // Inventory operations
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  getLowStockItems(): Promise<InventoryItem[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  // File upload using Supabase Storage
  async uploadFile(file: Buffer, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  // Driver operations
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver> {
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }

  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.isActive, true));
  }

  // Vehicle operations
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  // Assignment operations
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async getActiveAssignmentByDriverId(driverId: string): Promise<Assignment | undefined> {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.driverId, driverId), eq(assignments.isActive, true)));
    return assignment;
  }

  async deactivateAssignment(assignmentId: string): Promise<void> {
    await db
      .update(assignments)
      .set({ isActive: false, unassignedAt: new Date() })
      .where(eq(assignments.id, assignmentId));
  }

  // Trip operations
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async getTripsByDriverId(driverId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driverId))
      .orderBy(desc(trips.createdAt));
  }

  async getAllTrips(): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .orderBy(desc(trips.createdAt));
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  // Payout operations
  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [newPayout] = await db.insert(payouts).values(payout).returning();
    return newPayout;
  }

  async updatePayout(id: string, updates: Partial<InsertPayout>): Promise<Payout> {
    const [updatedPayout] = await db
      .update(payouts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payouts.id, id))
      .returning();
    return updatedPayout;
  }

  async getPendingPayouts(): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.status, 'pending'))
      .orderBy(desc(payouts.createdAt));
  }

  async getPayoutsByDriverId(driverId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.driverId, driverId))
      .orderBy(desc(payouts.createdAt));
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async getAllIncidents(): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.reportedAt));
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByEntity(entityId: string, entityType: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityId, entityId), eq(documents.entityType, entityType)))
      .orderBy(desc(documents.uploadedAt));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Fuel station operations
  async createFuelStation(fuelStation: InsertFuelStation): Promise<FuelStation> {
    const [newFuelStation] = await db.insert(fuelStations).values(fuelStation).returning();
    return newFuelStation;
  }

  async getAllFuelStations(): Promise<FuelStation[]> {
    return await db.select().from(fuelStations).where(eq(fuelStations.isActive, true));
  }

  async updateFuelStation(id: string, updates: Partial<InsertFuelStation>): Promise<FuelStation> {
    const [updatedFuelStation] = await db
      .update(fuelStations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fuelStations.id, id))
      .returning();
    return updatedFuelStation;
  }

  // Fuel record operations
  async createFuelRecord(fuelRecord: InsertFuelRecord): Promise<FuelRecord> {
    const [newFuelRecord] = await db.insert(fuelRecords).values(fuelRecord).returning();
    return newFuelRecord;
  }

  async getFuelRecordsByVehicleId(vehicleId: string): Promise<FuelRecord[]> {
    return await db
      .select()
      .from(fuelRecords)
      .where(eq(fuelRecords.vehicleId, vehicleId))
      .orderBy(desc(fuelRecords.refuelDate));
  }

  async getFuelRecordsByDriverId(driverId: string): Promise<FuelRecord[]> {
    return await db
      .select()
      .from(fuelRecords)
      .where(eq(fuelRecords.driverId, driverId))
      .orderBy(desc(fuelRecords.refuelDate));
  }

  async getAllFuelRecords(): Promise<FuelRecord[]> {
    return await db
      .select()
      .from(fuelRecords)
      .orderBy(desc(fuelRecords.refuelDate));
  }

  // Driver checklist operations
  async createDriverChecklist(checklist: InsertDriverChecklist): Promise<DriverChecklist> {
    const [newChecklist] = await db.insert(driverChecklists).values(checklist).returning();
    return newChecklist;
  }

  async getChecklistsByDriverId(driverId: string): Promise<DriverChecklist[]> {
    return await db
      .select()
      .from(driverChecklists)
      .where(eq(driverChecklists.driverId, driverId))
      .orderBy(desc(driverChecklists.createdAt));
  }

  async updateDriverChecklist(id: string, updates: Partial<InsertDriverChecklist>): Promise<DriverChecklist> {
    const [updatedChecklist] = await db
      .update(driverChecklists)
      .set(updates)
      .where(eq(driverChecklists.id, id))
      .returning();
    return updatedChecklist;
  }

  // Checklist item operations
  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [newItem] = await db.insert(checklistItems).values(item).returning();
    return newItem;
  }

  async getChecklistItemsByChecklistId(checklistId: string): Promise<ChecklistItem[]> {
    return await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.checklistId, checklistId));
  }

  async updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem> {
    const [updatedItem] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return updatedItem;
  }

  // Maintenance record operations
  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [newRecord] = await db.insert(maintenanceRecords).values(record).returning();
    return newRecord;
  }

  async getMaintenanceRecordsByVehicleId(vehicleId: string): Promise<MaintenanceRecord[]> {
    return await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.vehicleId, vehicleId))
      .orderBy(desc(maintenanceRecords.createdAt));
  }

  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return await db
      .select()
      .from(maintenanceRecords)
      .orderBy(desc(maintenanceRecords.createdAt));
  }

  async updateMaintenanceRecord(id: string, updates: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord> {
    const [updatedRecord] = await db
      .update(maintenanceRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Maintenance task operations
  async createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const [newTask] = await db.insert(maintenanceTasks).values(task).returning();
    return newTask;
  }

  async getMaintenanceTasksByRecordId(recordId: string): Promise<MaintenanceTask[]> {
    return await db
      .select()
      .from(maintenanceTasks)
      .where(eq(maintenanceTasks.maintenanceRecordId, recordId));
  }

  async updateMaintenanceTask(id: string, updates: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask> {
    const [updatedTask] = await db
      .update(maintenanceTasks)
      .set(updates)
      .where(eq(maintenanceTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Inventory operations
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.isActive, true));
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.isActive, true),
        sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`
      ));
  }
}

export const storage = new DatabaseStorage();