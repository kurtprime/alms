// db/schema/quiz-schema.ts

import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { lessonType } from "./lesson-schema";
import { user } from "./auth-schema";

// Quiz types enum
export const quizTypeEnum = pgEnum("quiz_type", [
  "multiple_choice",
  "true_false",
  "matching",
  "essay",
  "ordering",
]);

// Main quiz table
export const quiz = pgTable(
  "quiz",
  {
    id: serial("id").primaryKey(),
    lessonTypeId: integer("lesson_type_id")
      .references(() => lessonType.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description"),
    timeLimit: integer("time_limit"),
    maxAttempts: integer("max_attempts").default(1),
    shuffleQuestions: boolean("shuffle_questions").default(false),
    showScoreAfterSubmission: boolean("show_score_after_submission").default(
      false,
    ),
    showCorrectAnswers: boolean("show_correct_answers").default(false),
    status: varchar("status", { length: 20 }).$default(() => "draft"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdBy: varchar("created_by", { length: 255 })
      .references(() => user.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("quiz_lesson_type_idx").on(table.lessonTypeId),
    index("quiz_status_idx").on(table.status),
  ],
);

export const quizQuestion = pgTable(
  "quiz_question",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .references(() => quiz.id, { onDelete: "cascade" })
      .notNull(),

    question: text("question").notNull(),
    type: quizTypeEnum("type").notNull(),
    points: integer("points").default(1).notNull(),
    orderIndex: integer("order_index").notNull(),

    // ✅ Type-specific columns (nullable, only used when relevant)
    // For true_false:
    correctBoolean: boolean("correct_boolean"),

    // For fill_in_blank:
    blankCount: integer("blank_count"),

    // For short_answer/fill_in_blank (array of acceptable answers):
    acceptableAnswers: text("acceptable_answers").array(),

    // Image for the Question
    imageBase64Jpg: text("image_base_64_jpg"),

    // Common fields
    explanation: text("explanation"),
    hint: text("hint"),
    required: boolean("required").default(true),
  },
  (table) => [index("question_quiz_idx").on(table.quizId)],
);

// Separate table for matching question pairs
export const quizMatchingPair = pgTable(
  "quiz_matching_pair",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    questionId: integer("question_id")
      .references(() => quizQuestion.id, { onDelete: "cascade" })
      .notNull(),
    leftItem: text("left_item"), // Left column
    rightItem: text("right_item").notNull(), // Right column to match
    orderIndex: integer("order_index"),
    points: integer("points").notNull(),
    leftImageBase64Jpg: text("left_image_base_64_jpg"),
    rightImageBase64Jpg: text("right_image_base_64_jpg"),
  },
  (table) => [index("matching_question_idx").on(table.questionId)],
);

// Separate table for ordering question items
export const quizOrderingItem = pgTable(
  "quiz_ordering_item",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    questionId: integer("question_id")
      .references(() => quizQuestion.id, { onDelete: "cascade" })
      .notNull(),
    itemText: text("item_text").notNull(),
    correctPosition: integer("correct_position").notNull(), // 0, 1, 2, 3...
    imageBase64Jpg: text("image_base_64_jpg"),
    points: integer("points").notNull(),
  },
  (table) => [index("ordering_question_idx").on(table.questionId)],
);

// Simplified answer options (for MCQ)
export const quizAnswerOption = pgTable(
  "quiz_answer_option",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    questionId: integer("question_id")
      .references(() => quizQuestion.id, { onDelete: "cascade" })
      .notNull(),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").default(false),

    // Image for the Question
    imageBase64Jpg: text("image_base_64_jpg"),

    points: integer("points").default(0).notNull(),
    orderIndex: integer("order_index"),
    feedback: text("feedback"),
  },
  (table) => [index("option_question_idx").on(table.questionId)],
);

// Student attempts and responses remain the same
export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .references(() => quiz.id, { onDelete: "cascade" })
      .notNull(),
    studentId: varchar("student_id", { length: 255 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    status: varchar("status", { length: 20 })
      .$default(() => "in_progress")
      .notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at"),
    score: integer("score"),
    maxScore: integer("max_score"),
    percentage: integer("percentage"),
    passed: boolean("passed"),
    timeSpent: integer("time_spent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attempt_quiz_student_idx").on(table.quizId, table.studentId),
  ],
);

export const quizQuestionResponse = pgTable(
  "quiz_question_response",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .references(() => quizAttempt.id, { onDelete: "cascade" })
      .notNull(),
    questionId: integer("question_id")
      .references(() => quizQuestion.id, { onDelete: "cascade" })
      .notNull(),
    answer: json("answer").$type<
      | { type: "option"; optionId: number }
      | { type: "text"; text: string }
      | { type: "multiple"; optionIds: number[] }
      | { type: "ordering"; order: string[] }
    >(),
    isCorrect: boolean("is_correct"),
    pointsEarned: integer("points_earned"),
    teacherFeedback: text("teacher_feedback"),
    gradedAt: timestamp("graded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("response_attempt_idx").on(table.attemptId),
    index("response_question_idx").on(table.questionId),
  ],
);
