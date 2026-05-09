CREATE TABLE "certificate_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"issuer_id" integer NOT NULL,
	"course_name" text NOT NULL,
	"description" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"total_count" integer NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_issuers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_name" text NOT NULL,
	"logo_url" text NOT NULL,
	"instructor_name" text NOT NULL,
	"reply_to_email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"issuer_id" integer NOT NULL,
	"student_name" text NOT NULL,
	"student_email" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_valid" boolean DEFAULT true NOT NULL,
	"email_sent_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "certificate_batches" ADD CONSTRAINT "certificate_batches_issuer_id_certificate_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."certificate_issuers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_batch_id_certificate_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."certificate_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issuer_id_certificate_issuers_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."certificate_issuers"("id") ON DELETE no action ON UPDATE no action;