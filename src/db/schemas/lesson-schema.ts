import {
  boolean,
  index,
  pgEnum,
  pgTable,
  serial,
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
    terms: lessonTerm("terms").notNull(),
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
      table.terms
    ),
    index("lesson_class_subject_idx").on(table.classSubjectId),
    index("lesson_status_idx").on(table.status, table.classSubjectId),
  ]
);
