// db/schema/users.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export type UserRole = "candidate" | "employer";
export type AuthProvider = "credentials" | "google";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),

  // For credentials-based accounts
  passwordHash: text("password_hash"),

  // For Google-based accounts
  provider: varchar("provider", { length: 32 })
    .notNull()
    .default("credentials"), // "credentials" | "google"
  googleId: varchar("google_id", { length: 255 }), // sub from Google token

  role: varchar("role", { length: 32 }).notNull(), // "candidate" | "employer"

  // Only required/used for employers
  companyName: varchar("company_name", { length: 255 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
