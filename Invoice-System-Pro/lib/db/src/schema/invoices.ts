import { pgTable, serial, text, timestamp, integer, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { staffTable } from "./staff";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "paid", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["50%", "100%", "contra_entrega"]);

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id").references(() => clientsTable.id),
  measuredById: integer("measured_by_id").references(() => staffTable.id),
  quotedById: integer("quoted_by_id").references(() => staffTable.id),
  budgetDate: date("budget_date"),
  deliveryDate: date("delivery_date"),
  paymentMethod: paymentMethodEnum("payment_method").default("50%"),
  downPayment: numeric("down_payment", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  userId: integer("user_id").references(() => usersTable.id),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItemsTable = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => productsTable.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const invoiceRelations = relations(invoicesTable, ({ one, many }) => ({
  client: one(clientsTable, { fields: [invoicesTable.clientId], references: [clientsTable.id] }),
  measuredBy: one(staffTable, { fields: [invoicesTable.measuredById], references: [staffTable.id], relationName: "measuredBy" }),
  quotedBy: one(staffTable, { fields: [invoicesTable.quotedById], references: [staffTable.id], relationName: "quotedBy" }),
  user: one(usersTable, { fields: [invoicesTable.userId], references: [usersTable.id] }),
  items: many(invoiceItemsTable),
}));

export const invoiceItemRelations = relations(invoiceItemsTable, ({ one }) => ({
  invoice: one(invoicesTable, { fields: [invoiceItemsTable.invoiceId], references: [invoicesTable.id] }),
  product: one(productsTable, { fields: [invoiceItemsTable.productId], references: [productsTable.id] }),
}));

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

export const insertInvoiceItemSchema = createInsertSchema(invoiceItemsTable).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItemsTable.$inferSelect;
