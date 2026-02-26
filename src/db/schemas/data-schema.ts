import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lessonType } from "./lesson-schema";

export const privacyEnum = pgEnum("privacy", ["private", "public"]);
export type PrivacyEnum = typeof privacyEnum;

export const comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  privacy: privacyEnum().notNull(),
  text: text("text").notNull(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lessonTypeId: integer("lesson_type_id")
    .notNull()
    .references(() => lessonType.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const markAsDone = pgTable(
  "mark_as_done",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isDone: boolean("is_done"),
    lessonTypeId: integer("lesson_type_id")
      .notNull()
      .references(() => lessonType.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    // ✅ This creates a unique rule: One user cannot have the same lessonTypeId twice
    uniqueIndex("user_lesson_unique_idx").on(table.userId, table.lessonTypeId),
  ],
);
