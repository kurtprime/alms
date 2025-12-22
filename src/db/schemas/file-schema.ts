import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { lessonType } from "./lesson-schema";

export const lessonDocument = pgTable(
  "lesson_document",
  {
    id: serial("id").primaryKey(),
    lessonTypeId: integer("lesson_type_id")
      .references(() => lessonType.id, {
        onDelete: "set null",
      })
      .notNull(),
    name: text("name"),
    fileHash: text("file_hash"),
    size: integer("size"),
    fileKey: text("key").notNull().unique(),
    fileUrl: text("url").notNull(),
    fileUfsUrl: text("ufs_url"),
    fileType: text("file_type"),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (table) => [
    index("file_key_idx").on(table.fileKey),
    index("lesson_id_idx").on(table.lessonTypeId),
  ]
);
