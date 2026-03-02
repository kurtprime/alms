import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { classSubjects, publishStatusEnum } from "./subject-schema";
import { user } from "../schema";

export const lessonTerm = pgEnum("lesson_term", [
  "prelims",
  "midterms",
  "pre-finals",
  "finals",
]);
export type LessonTerm = typeof lessonTerm;
export const lesson = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    terms: lessonTerm("terms"),
    classSubjectId: varchar("class_subject_id", { length: 255 })
      .references(() => classSubjects.id, {
        onDelete: "cascade",
      })
      .notNull(),
    status: publishStatusEnum("status")
      .$default(() => "published")
      .notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_class_subject_term_unique").on(
      table.classSubjectId,
      table.terms,
    ),
    index("lesson_class_subject_idx").on(table.classSubjectId),
    index("lesson_status_idx").on(table.status, table.classSubjectId),
  ],
);
export const lessonTypeEnum = pgEnum("lesson_types", [
  "handout",
  "quiz",
  "assignment",
]);
export const lessonType = pgTable(
  "lesson_type",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }),
    lessonId: integer("lesson_id")
      .references(() => lesson.id, {
        onDelete: "cascade",
      })
      .notNull(),
    type: lessonTypeEnum().notNull(),
    status: publishStatusEnum("status").default("draft"),
    markup: text("markup"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("lesson_lesson_id_idx").on(table.lessonId)],
);

export const announcementTypeEnum = pgEnum("announcement_type", [
  "lesson_publish", // Auto-generated when a lesson is published
  "custom", // Teacher wrote a custom message
]);

export const announcement = pgTable(
  "announcement",
  {
    id: serial("id").primaryKey(),
    classId: varchar("class_id", { length: 255 })
      .notNull()
      .references(() => classSubjects.id, { onDelete: "cascade" }),

    // Nullable: Links to the specific lesson/quiz/assignment
    lessonTypeId: integer("lesson_type_id").references(() => lessonType.id, {
      onDelete: "cascade",
    }),

    type: announcementTypeEnum("type").notNull().default("lesson_publish"),

    // The actual message content.
    // If null for 'lesson_publish', the app can generate it dynamically or the background job sets it.
    message: text("message"),

    createdBy: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("announcement_class_idx").on(table.classId, table.createdAt),
  ],
);
