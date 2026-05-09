CREATE TYPE "public"."feedback_type" AS ENUM('emoji', 'text', 'score');--> statement-breakpoint
CREATE TYPE "public"."game_state" AS ENUM('waiting', 'question', 'results', 'leaderboard', 'ended');--> statement-breakpoint
CREATE TABLE "feedback_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"respondent_id" varchar(255) NOT NULL,
	"response_type" "feedback_type" NOT NULL,
	"emoji_response" varchar(10),
	"text_response" text,
	"score_response" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"type" "feedback_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "feedback_sessions_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "feeling_emojis" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"participant_id" varchar(255) NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeling_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	CONSTRAINT "feeling_sessions_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "kahoot_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"selected_answer" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_to_answer" integer NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kahoot_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(255) NOT NULL,
	"game_name" text NOT NULL,
	"state" "game_state" DEFAULT 'waiting' NOT NULL,
	"current_question_index" integer DEFAULT 0,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	CONSTRAINT "kahoot_games_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "kahoot_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_name" varchar(255) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kahoot_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"question_order" integer NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" integer NOT NULL,
	"time_limit" integer DEFAULT 30 NOT NULL,
	"points" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"option_order" integer NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"voter_id" varchar(255) NOT NULL,
	"voted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(255) NOT NULL,
	"question" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	CONSTRAINT "polls_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_session_id_feedback_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."feedback_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeling_emojis" ADD CONSTRAINT "feeling_emojis_session_id_feeling_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."feeling_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kahoot_answers" ADD CONSTRAINT "kahoot_answers_game_id_kahoot_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."kahoot_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kahoot_answers" ADD CONSTRAINT "kahoot_answers_question_id_kahoot_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."kahoot_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kahoot_answers" ADD CONSTRAINT "kahoot_answers_player_id_kahoot_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."kahoot_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kahoot_players" ADD CONSTRAINT "kahoot_players_game_id_kahoot_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."kahoot_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kahoot_questions" ADD CONSTRAINT "kahoot_questions_game_id_kahoot_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."kahoot_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE cascade ON UPDATE no action;