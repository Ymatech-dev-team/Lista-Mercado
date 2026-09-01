// Schema Drizzle — espelha as 8 tabelas do design.md §6.
// IMPORTANTE: o DDL (criação de tabela, índices parciais, CHECKs, índices de FK) é aplicado
// MANUALMENTE via o SQL do design.md §6 (o JP roda no Neon). Este arquivo dá tipos e relações
// para as queries do app; não é a fonte da verdade do DDL. Ver design.md §6.

import { pgTable, uuid, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: ts("email_verified_at"),
  consentAt: ts("consent_at").notNull(),
  privacyVersion: text("privacy_version").notNull(),
  monthlyBudgetCents: integer("monthly_budget_cents"), // teto de gasto mensal opcional; NULL = sem teto. CHECK (>=0) no SQL
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  absoluteExpiresAt: ts("absolute_expires_at").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
});

export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  status: text("status").notNull().default("active"), // 'active' | 'completed' (CHECK no SQL)
  createdAt: ts("created_at").notNull().defaultNow(),
  completedAt: ts("completed_at"),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
});

export const listItems = pgTable("list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id").notNull().references(() => lists.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1), // CHECK (quantity > 0) no SQL
  unitPriceCents: integer("unit_price_cents"), // snapshot do preço unitário; NULL = sem preço (≠ 0). CHECK (>=0) no SQL
  isPurchased: boolean("is_purchased").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export type ListStatus = "active" | "completed";
