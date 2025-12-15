ALTER TABLE "member" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "class_subject" ALTER COLUMN "class_id" SET DATA TYPE varchar(255);--> statement-breakpoint
CREATE INDEX "member_id_idx" ON "member" USING btree ("id","role");