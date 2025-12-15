import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { organization } from "./organization-schema";

export const statusEnumValues = ["draft", "published", "archived"] as const;
export const publishStatusEnum = pgEnum("status", statusEnumValues);

export const subjects = pgTable("subject", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 })
    .references(() => subjectName.id, {
      onDelete: "cascade",
    })
    .notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  status: publishStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const classSubjects = pgTable("class_subject", {
  id: varchar("id", { length: 255 }).primaryKey(),
  enrolledClass: varchar("class_id", { length: 255 }).references(
    () => organization.id,
    {
      onDelete: "cascade",
    }
  ),
  subjectId: integer("subject_id").references(() => subjects.id, {
    onDelete: "cascade",
  }),
  teacherId: varchar("teacher_id", { length: 255 })
    .references(() => user.id, { onDelete: "set null" })
    .notNull(),
  enrolledAt: timestamp("enrolled_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const subjectName = pgTable("subject_name", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
