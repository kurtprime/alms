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
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("lesson_lesson_id_idx").on(table.lessonId)],
);
