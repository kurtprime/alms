CREATE TYPE "public"."privacy" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"privacy" "privacy" NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"lesson_type_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mark_as_done" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"is_done" boolean,
	"lesson_type_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_lesson_type_id_lesson_type_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mark_as_done" ADD CONSTRAINT "mark_as_done_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mark_as_done" ADD CONSTRAINT "mark_as_done_lesson_type_id_lesson_type_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_lesson_unique_idx" ON "mark_as_done" USING btree ("user_id","lesson_type_id");