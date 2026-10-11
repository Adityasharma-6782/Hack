import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  sessionToken: text("session_token"),
  questionOrder: text("question_order").array().notNull().default([]),
  activeQuestionId: text("active_question_id"),
  points: integer("points").notNull().default(0),
  hintsUsed: jsonb("hints_used").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSolveAt: timestamp("last_solve_at", { withTimezone: true }),
});

export const solves = pgTable("solves", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  points: integer("points").notNull(),
  solvedAt: timestamp("solved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionOverrides = pgTable("question_overrides", {
  id: text("id").primaryKey(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
