import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth-schema";
import { organization } from "./organization-schema";
import { teacher } from "@/lib/permission";

export const statusEnumValues = ["published", "draft", "archived"] as const;
export const publishStatusEnum = pgEnum("status", statusEnumValues);
export const subjects = pgTable("subject", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(8)),
  name: text("name")
    .references(() => subjectName.id)
    .notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  status: publishStatusEnum("status").default("draft"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const classSubjects = pgTable("class_subject", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  enrolledClass: text("class_id").references(() => organization.id, {
    onDelete: "cascade",
  }),
  subjectId: text("subject_id").references(() => subjects.id, {
    onDelete: "cascade",
  }),
  teacherId: text("teacher_id")
    .references(() => user.id, { onDelete: "set null" })
    .notNull(),
  assignedBy: text("assigned_by").references(() => user.id),
  enrolledAt: timestamp("enrolled_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const subjectName = pgTable("subject_name", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
