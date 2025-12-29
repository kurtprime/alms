import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
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

export const mdxEditorImageUpload = pgTable(
  "mdx_editor_image_upload",
  {
    id: serial("id").primaryKey(),
    lessonTypeId: integer("lesson_type_id")
      .notNull()
      .references(() => lessonType.id, { onDelete: "cascade" }),
    fileKey: text("key").notNull().unique(),
    fileUrl: text("url").notNull(),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (table) => [
    index("image_upload_key_idx").on(table.fileKey),
    index("user_id_idx").on(table.lessonTypeId),
  ]
);
