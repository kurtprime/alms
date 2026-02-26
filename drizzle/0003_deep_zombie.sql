CREATE TYPE "public"."organization_member_strand" AS ENUM('Not Specified', 'Accountancy, Business and Management', 'Humanities and Social Sciences', 'Information and Communications Technology', 'Home Economics', 'Science, Technology, Engineering, and Mathematics');--> statement-breakpoint
CREATE TYPE "public"."lesson_term" AS ENUM('prelims', 'midterms', 'pre-finals', 'finals');--> statement-breakpoint
CREATE TYPE "public"."lesson_types" AS ENUM('handout', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."quiz_type" AS ENUM('multiple_choice', 'true_false', 'matching', 'essay', 'ordering');--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"terms" "lesson_term",
	"class_subject_id" varchar(255) NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"lesson_id" integer NOT NULL,
	"type" "lesson_types" NOT NULL,
	"status" "status" DEFAULT 'draft',
	"markup" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_type_id" integer,
	"name" text,
	"file_hash" text,
	"size" integer,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"ufs_url" text,
	"file_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_document_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "mdx_editor_image_upload" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_type_id" integer,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mdx_editor_image_upload_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "quiz" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_type_id" integer NOT NULL,
	"description" text,
	"time_limit" integer,
	"max_attempts" integer DEFAULT 1,
	"shuffle_questions" boolean DEFAULT false,
	"show_score_after_submission" boolean DEFAULT false,
	"show_correct_answers" boolean DEFAULT false,
	"score" integer,
	"status" varchar(20),
	"start_date" timestamp,
	"end_date" timestamp,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answer_option" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false,
	"image_base_64_jpg" text,
	"points" integer DEFAULT 0 NOT NULL,
	"order_index" integer,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "quiz_attempt" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"student_id" varchar(255) NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" integer,
	"max_score" integer,
	"percentage" integer,
	"passed" boolean,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_matching_pair" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"left_item" text,
	"right_item" text NOT NULL,
	"order_index" integer,
	"points" integer NOT NULL,
	"left_image_base_64_jpg" text,
	"right_image_base_64_jpg" text
);
--> statement-breakpoint
CREATE TABLE "quiz_ordering_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"item_text" text NOT NULL,
	"correct_position" integer NOT NULL,
	"image_base_64_jpg" text,
	"points" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question" text NOT NULL,
	"type" "quiz_type" NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"order_index" integer NOT NULL,
	"correct_boolean" boolean,
	"blank_count" integer,
	"acceptable_answers" text[],
	"image_base_64_jpg" text,
	"explanation" text,
	"hint" text,
	"required" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "quiz_question_response" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" json,
	"is_correct" boolean,
	"points_earned" integer,
	"teacher_feedback" text,
	"graded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "member_id_idx";--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "class_subject" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "subject_name" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "custom_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "on_boarded" boolean;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "strand" "organization_member_strand";--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_class_subject_id_class_subject_id_fk" FOREIGN KEY ("class_subject_id") REFERENCES "public"."class_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_type" ADD CONSTRAINT "lesson_type_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_document" ADD CONSTRAINT "lesson_document_lesson_type_id_lesson_type_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdx_editor_image_upload" ADD CONSTRAINT "mdx_editor_image_upload_lesson_type_id_lesson_type_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_lesson_type_id_lesson_type_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answer_option" ADD CONSTRAINT "quiz_answer_option_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_matching_pair" ADD CONSTRAINT "quiz_matching_pair_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_ordering_item" ADD CONSTRAINT "quiz_ordering_item_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question_response" ADD CONSTRAINT "quiz_question_response_attempt_id_quiz_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question_response" ADD CONSTRAINT "quiz_question_response_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_class_subject_term_unique" ON "lessons" USING btree ("class_subject_id","terms");--> statement-breakpoint
CREATE INDEX "lesson_class_subject_idx" ON "lessons" USING btree ("class_subject_id");--> statement-breakpoint
CREATE INDEX "lesson_status_idx" ON "lessons" USING btree ("status","class_subject_id");--> statement-breakpoint
CREATE INDEX "lesson_lesson_id_idx" ON "lesson_type" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "file_key_idx" ON "lesson_document" USING btree ("key");--> statement-breakpoint
CREATE INDEX "lesson_id_idx" ON "lesson_document" USING btree ("lesson_type_id");--> statement-breakpoint
CREATE INDEX "image_upload_key_idx" ON "mdx_editor_image_upload" USING btree ("key");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "mdx_editor_image_upload" USING btree ("lesson_type_id");--> statement-breakpoint
CREATE INDEX "quiz_lesson_type_idx" ON "quiz" USING btree ("lesson_type_id");--> statement-breakpoint
CREATE INDEX "quiz_status_idx" ON "quiz" USING btree ("status");--> statement-breakpoint
CREATE INDEX "option_question_idx" ON "quiz_answer_option" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "attempt_quiz_student_idx" ON "quiz_attempt" USING btree ("quiz_id","student_id");--> statement-breakpoint
CREATE INDEX "matching_question_idx" ON "quiz_matching_pair" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "ordering_question_idx" ON "quiz_ordering_item" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_quiz_idx" ON "quiz_question" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "response_attempt_idx" ON "quiz_question_response" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "response_question_idx" ON "quiz_question_response" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_custom_id_idx" ON "user" USING btree ("custom_id");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_role_created_idx" ON "user" USING btree ("role","created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "member_organization_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_org_role_idx" ON "member" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "enrolled_class_subject_teacher_unique" ON "class_subject" USING btree ("class_id","subject_id","teacher_id");--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "logo_key";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_custom_id_unique" UNIQUE("custom_id");