import { boolean, decimal, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiServices = pgTable("ai_services", {
    id: text("id").primaryKey(), 
    price: decimal("price", {precision: 12, scale: 6}).notNull(),
    platformFee: decimal("platform_fee", {precision: 12, scale: 6}).notNull(),
    description: text("description").notNull(),
    isActive: boolean("is_active").notNull().default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})



export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;
