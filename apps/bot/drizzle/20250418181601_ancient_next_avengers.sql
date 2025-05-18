-- Create Extensions for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";--> statement-breakpoint

CREATE TYPE "public"."event_state" AS ENUM('inactive', 'started', 'paused');--> statement-breakpoint
CREATE TYPE "public"."event_history_type_enum" AS ENUM('weekly', 'global');--> statement-breakpoint
CREATE TABLE "event_activitie" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"text_channel_id" text NOT NULL,
	"voice_channel_id" text NOT NULL,
	"status" "event_state" DEFAULT 'inactive',
	"event_time" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guild_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"eventsmode_id" uuid NOT NULL,
	CONSTRAINT "event_activitie_text_channel_id_unique" UNIQUE("text_channel_id"),
	CONSTRAINT "event_activitie_voice_channel_id_unique" UNIQUE("voice_channel_id"),
	CONSTRAINT "event_activitie_eventsmode_id_unique" UNIQUE("eventsmode_id")
);
--> statement-breakpoint
CREATE TABLE "event_ban" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"days" integer NOT NULL,
	"reason" text NOT NULL,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"executor_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"guild_id" text
);
--> statement-breakpoint
CREATE TABLE "event_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "event_history_type_enum" DEFAULT 'global' NOT NULL,
	"total_time" integer NOT NULL,
	"total_salary" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"eventmode_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"guild_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"multiplayer" double precision NOT NULL,
	"start_embed" json NOT NULL,
	"candy_per_minute" double precision NOT NULL,
	"guild_id" text,
	CONSTRAINT "event_name_category_unique" UNIQUE("name","category")
);
--> statement-breakpoint
CREATE TABLE "eventmode" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"is_hired" boolean DEFAULT true NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"permission_role" integer DEFAULT 1 NOT NULL,
	"total_time" integer DEFAULT 0 NOT NULL,
	"weekly_time" integer DEFAULT 0 NOT NULL,
	"total_salary" integer DEFAULT 0 NOT NULL,
	"weekly_salary" integer DEFAULT 0 NOT NULL,
	"hearts" integer DEFAULT 0 NOT NULL,
	"favorite_event" text DEFAULT 'none' NOT NULL,
	"hired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventmode_permission_check" CHECK ("eventmode"."permission_role" BETWEEN 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "guild_logger" (
	"id" text PRIMARY KEY NOT NULL,
	"is_configured" boolean DEFAULT false NOT NULL,
	"guild_to_log" text,
	"channel_to_log" text
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"proto_settings" jsonb DEFAULT '{"general":{"minimumWeeklyQuota":300},"roles":{"adminRoleId":null,"moderatorRoleId":null,"curatorRoleId":null,"coachRoleId":null,"eventsmodeRoleId":null},"channels":{"eventCategoryId":null,"announceEventChannelId":null,"startedEventCategoryId":null},"features":{"eventAnnouncement":false,"eventAutoPayment":false,"eventActiveCategory":false}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text,
	"reputation_score" integer DEFAULT 100 NOT NULL,
	"total_event_time" integer DEFAULT 0 NOT NULL,
	"favorite_event" text DEFAULT 'none' NOT NULL,
	CONSTRAINT "user_user_id_guild_id_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE "warns" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"is_verbal" boolean NOT NULL,
	"reason" text NOT NULL,
	"warned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guild_id" text NOT NULL,
	"executor_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_activitie" ADD CONSTRAINT "event_activitie_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_activitie" ADD CONSTRAINT "event_activitie_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_activitie" ADD CONSTRAINT "event_activitie_eventsmode_id_eventmode_id_fk" FOREIGN KEY ("eventsmode_id") REFERENCES "public"."eventmode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_ban" ADD CONSTRAINT "event_ban_executor_id_eventmode_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."eventmode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_ban" ADD CONSTRAINT "event_ban_target_id_user_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_ban" ADD CONSTRAINT "event_ban_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_history" ADD CONSTRAINT "event_history_eventmode_id_eventmode_id_fk" FOREIGN KEY ("eventmode_id") REFERENCES "public"."eventmode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_history" ADD CONSTRAINT "event_history_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_history" ADD CONSTRAINT "event_history_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventmode" ADD CONSTRAINT "eventmode_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_logger" ADD CONSTRAINT "guild_logger_id_guilds_id_fk" FOREIGN KEY ("id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warns" ADD CONSTRAINT "warns_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warns" ADD CONSTRAINT "warns_executor_id_eventmode_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."eventmode"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warns" ADD CONSTRAINT "warns_target_id_eventmode_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."eventmode"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_name_category_index" ON "event" USING btree ("name","category");--> statement-breakpoint
CREATE INDEX "user_user_id_guild_id_index" ON "user" USING btree ("user_id","guild_id");
