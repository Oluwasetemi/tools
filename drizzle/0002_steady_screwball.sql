CREATE TABLE "testimonial_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"title" text NOT NULL,
	"created_by" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "testimonial_sessions_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"room_id" text NOT NULL,
	"student_name" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"moderated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_session_id_testimonial_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."testimonial_sessions"("id") ON DELETE no action ON UPDATE no action;