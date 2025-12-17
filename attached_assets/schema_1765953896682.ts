import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users with role-based access
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 200 }),
  role: varchar("role", { length: 50 }).notNull().default("user"), // 'admin' or 'user'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturers
export const manufacturers = pgTable("manufacturers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Locations
export const locations = pgTable("locations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  description: text("description"),
  address: text("address"),
  building: varchar("building", { length: 100 }),
  floor: varchar("floor", { length: 50 }),
  room: varchar("room", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Categories
export const assetCategories = pgTable("asset_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Sub Categories
export const assetSubCategories = pgTable("asset_sub_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => assetCategories.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset code sequence for auto-generation
export const assetCodeSequence = pgTable("asset_code_sequence", {
  id: integer("id").primaryKey().default(1),
  lastNumber: integer("last_number").notNull().default(0),
});

// Assets
export const assets = pgTable("assets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => assetCategories.id),
  subCategoryId: integer("sub_category_id").references(() => assetSubCategories.id),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  locationId: integer("location_id").references(() => locations.id),
  status: varchar("status", { length: 50 }).notNull().default("working"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  purchaseDate: date("purchase_date"),
  serialNumber: varchar("serial_number", { length: 100 }),
  model: varchar("model", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignees (Employees)
export const assignees = pgTable("assignees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignments
export const assignments = pgTable("assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  assigneeId: integer("assignee_id").references(() => assignees.id).notNull(),
  assignmentDate: date("assignment_date").notNull(),
  recoveryDate: date("recovery_date"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  assetStatus: varchar("asset_status", { length: 50 }).notNull().default("working"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  assets: many(assets),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  assets: many(assets),
}));

export const assetCategoriesRelations = relations(assetCategories, ({ many }) => ({
  assets: many(assets),
  subCategories: many(assetSubCategories),
}));

export const assetSubCategoriesRelations = relations(assetSubCategories, ({ one, many }) => ({
  category: one(assetCategories, {
    fields: [assetSubCategories.categoryId],
    references: [assetCategories.id],
  }),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  category: one(assetCategories, {
    fields: [assets.categoryId],
    references: [assetCategories.id],
  }),
  subCategory: one(assetSubCategories, {
    fields: [assets.subCategoryId],
    references: [assetSubCategories.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [assets.manufacturerId],
    references: [manufacturers.id],
  }),
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  assignments: many(assignments),
}));

export const assigneesRelations = relations(assignees, ({ many }) => ({
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  asset: one(assets, {
    fields: [assignments.assetId],
    references: [assets.id],
  }),
  assignee: one(assignees, {
    fields: [assignments.assigneeId],
    references: [assignees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetCategorySchema = createInsertSchema(assetCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSubCategorySchema = createInsertSchema(assetSubCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  code: z.string().optional(),
});
export const insertAssigneeSchema = createInsertSchema(assignees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, updatedAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertAssetCategory = z.infer<typeof insertAssetCategorySchema>;
export type AssetCategory = typeof assetCategories.$inferSelect;

export type InsertAssetSubCategory = z.infer<typeof insertAssetSubCategorySchema>;
export type AssetSubCategory = typeof assetSubCategories.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertAssignee = z.infer<typeof insertAssigneeSchema>;
export type Assignee = typeof assignees.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// Extended types with relations
export type AssetWithRelations = Asset & { 
  category?: AssetCategory | null;
  subCategory?: AssetSubCategory | null;
  manufacturer?: Manufacturer | null;
  location?: Location | null;
  currentAssignee?: Assignee | null;
};

export type AssignmentWithDetails = Assignment & { 
  asset?: Asset | null; 
  assignee?: Assignee | null;
};
