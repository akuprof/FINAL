import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'driver']);

// Trip status enum
export const tripStatusEnum = pgEnum('trip_status', ['pending', 'completed', 'cancelled']);

// Payout status enum
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'approved', 'rejected', 'paid']);

// Vehicle status enum
export const vehicleStatusEnum = pgEnum('vehicle_status', ['active', 'maintenance', 'inactive']);

// Fuel record type enum
export const fuelRecordTypeEnum = pgEnum('fuel_record_type', ['refuel', 'distribution', 'transfer']);

// Maintenance status enum
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);

// Checklist status enum
export const checklistStatusEnum = pgEnum('checklist_status', ['pending', 'completed', 'failed']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('driver'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Drivers table
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeId: varchar("employee_id").unique().notNull(),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  licenseNumber: varchar("license_number").unique(),
  licenseExpiryDate: timestamp("license_expiry_date"),
  dateOfBirth: timestamp("date_of_birth"),
  emergencyContact: varchar("emergency_contact"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationNumber: varchar("registration_number").unique().notNull(),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year"),
  capacity: integer("capacity"),
  fuelType: varchar("fuel_type"),
  insuranceNumber: varchar("insurance_number"),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  permitNumber: varchar("permit_number"),
  permitExpiryDate: timestamp("permit_expiry_date"),
  status: vehicleStatusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver-Vehicle assignments
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
  isActive: boolean("is_active").default(true),
});

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: tripStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payouts table
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  calculatedAmount: decimal("calculated_amount", { precision: 10, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  status: payoutStatusEnum("status").default('pending'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  incidentType: varchar("incident_type").notNull(),
  description: text("description").notNull(),
  damageAmount: decimal("damage_amount", { precision: 10, scale: 2 }),
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  isResolved: boolean("is_resolved").default(false),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull(), // driver_id or vehicle_id
  entityType: varchar("entity_type").notNull(), // 'driver' or 'vehicle'
  documentType: varchar("document_type").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  expiryDate: timestamp("expiry_date"),
});

// Fuel stations table
export const fuelStations = pgTable("fuel_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  location: text("location").notNull(),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  contractDetails: text("contract_details"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fuel records table
export const fuelRecords = pgTable("fuel_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  fuelStationId: varchar("fuel_station_id").references(() => fuelStations.id),
  recordType: fuelRecordTypeEnum("record_type").notNull(),
  fuelType: varchar("fuel_type").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerLiter: decimal("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  odometerReading: integer("odometer_reading"),
  receiptNumber: varchar("receipt_number"),
  notes: text("notes"),
  refuelDate: timestamp("refuel_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver checklists table
export const driverChecklists = pgTable("driver_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  checklistType: varchar("checklist_type").notNull(), // 'pre_trip', 'post_trip', 'inventory', 'maintenance'
  status: checklistStatusEnum("status").default('pending'),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist items table
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id").references(() => driverChecklists.id),
  itemName: varchar("item_name").notNull(),
  itemCategory: varchar("item_category").notNull(), // 'safety', 'inventory', 'maintenance', 'documentation'
  isChecked: boolean("is_checked").default(false),
  condition: varchar("condition"), // 'good', 'fair', 'poor', 'needs_attention'
  quantity: integer("quantity"),
  notes: text("notes"),
  imageUrl: varchar("image_url"),
});

// Maintenance records table
export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  maintenanceType: varchar("maintenance_type").notNull(), // 'scheduled', 'repair', 'inspection', 'service'
  description: text("description").notNull(),
  status: maintenanceStatusEnum("status").default('scheduled'),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  serviceProvider: varchar("service_provider"),
  odometerReading: integer("odometer_reading"),
  nextServiceDue: timestamp("next_service_due"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance tasks table
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRecordId: varchar("maintenance_record_id").references(() => maintenanceRecords.id),
  taskName: varchar("task_name").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  assignedTo: varchar("assigned_to"),
  completedBy: varchar("completed_by"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  partsUsed: text("parts_used"), // JSON string of parts
  cost: decimal("cost", { precision: 10, scale: 2 }),
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemName: varchar("item_name").notNull(),
  itemCode: varchar("item_code").unique(),
  category: varchar("category").notNull(), // 'spare_parts', 'tools', 'safety_equipment', 'consumables'
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock").default(0),
  maxStock: integer("max_stock"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  location: varchar("location"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [users.id],
    references: [drivers.userId],
  }),
  approvedPayouts: many(payouts),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  assignments: many(assignments),
  trips: many(trips),
  payouts: many(payouts),
  incidents: many(incidents),
  documents: many(documents),
  fuelRecords: many(fuelRecords),
  driverChecklists: many(driverChecklists),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  assignments: many(assignments),
  trips: many(trips),
  incidents: many(incidents),
  documents: many(documents),
  fuelRecords: many(fuelRecords),
  maintenanceRecords: many(maintenanceRecords),
  driverChecklists: many(driverChecklists),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  driver: one(drivers, {
    fields: [assignments.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [assignments.vehicleId],
    references: [vehicles.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  payout: one(payouts),
  incidents: many(incidents),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  trip: one(trips, {
    fields: [payouts.tripId],
    references: [trips.id],
  }),
  driver: one(drivers, {
    fields: [payouts.driverId],
    references: [drivers.id],
  }),
  approver: one(users, {
    fields: [payouts.approvedBy],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  trip: one(trips, {
    fields: [incidents.tripId],
    references: [trips.id],
  }),
  driver: one(drivers, {
    fields: [incidents.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [incidents.vehicleId],
    references: [vehicles.id],
  }),
}));

export const fuelStationsRelations = relations(fuelStations, ({ many }) => ({
  fuelRecords: many(fuelRecords),
}));

export const fuelRecordsRelations = relations(fuelRecords, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [fuelRecords.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [fuelRecords.driverId],
    references: [drivers.id],
  }),
  fuelStation: one(fuelStations, {
    fields: [fuelRecords.fuelStationId],
    references: [fuelStations.id],
  }),
}));

export const driverChecklistsRelations = relations(driverChecklists, ({ one, many }) => ({
  driver: one(drivers, {
    fields: [driverChecklists.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [driverChecklists.vehicleId],
    references: [vehicles.id],
  }),
  checklistItems: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(driverChecklists, {
    fields: [checklistItems.checklistId],
    references: [driverChecklists.id],
  }),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceRecords.vehicleId],
    references: [vehicles.id],
  }),
  maintenanceTasks: many(maintenanceTasks),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one }) => ({
  maintenanceRecord: one(maintenanceRecords, {
    fields: [maintenanceTasks.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertFuelStationSchema = createInsertSchema(fuelStations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFuelRecordSchema = createInsertSchema(fuelRecords).omit({
  id: true,
  createdAt: true,
});

export const insertDriverChecklistSchema = createInsertSchema(driverChecklists).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({
  id: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type FuelStation = typeof fuelStations.$inferSelect;
export type InsertFuelStation = z.infer<typeof insertFuelStationSchema>;

export type FuelRecord = typeof fuelRecords.$inferSelect;
export type InsertFuelRecord = z.infer<typeof insertFuelRecordSchema>;

export type DriverChecklist = typeof driverChecklists.$inferSelect;
export type InsertDriverChecklist = z.infer<typeof insertDriverChecklistSchema>;

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;

export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
