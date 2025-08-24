import {
  users,
  drivers,
  vehicles,
  trips,
  payouts,
  assignments,
  incidents,
  documents,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  getDocumentsByEntity(entityId: string, entityType: string): Promise<Document[]>;
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

  async getDocumentsByEntity(entityId: string, entityType: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityId, entityId), eq(documents.entityType, entityType)))
      .orderBy(desc(documents.uploadedAt));
  }
}

export const storage = new DatabaseStorage();
