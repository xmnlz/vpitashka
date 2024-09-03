DO $$ BEGIN
 CREATE TYPE "public"."event_history_type_enum" AS ENUM('weekly', 'global');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"text_channel_id" text NOT NULL,
	"voice_channel_id" text NOT NULL,
	"event_time" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_stared" boolean DEFAULT false NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"is_ended" boolean DEFAULT false NOT NULL,
	"guild_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"eventsmode_id" uuid NOT NULL,
	CONSTRAINT "event_activities_text_channel_id_unique" UNIQUE("text_channel_id"),
	CONSTRAINT "event_activities_voice_channel_id_unique" UNIQUE("voice_channel_id"),
	CONSTRAINT "event_activities_eventsmode_id_unique" UNIQUE("eventsmode_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_bans" (
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
CREATE TABLE IF NOT EXISTS "event_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "event_history_type_enum" DEFAULT 'global' NOT NULL,
	"total_time" integer NOT NULL,
	"total_salary" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"eventsmode_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"guild_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"multiplayer" double precision NOT NULL,
	"start_embed" json NOT NULL,
	"candy_per_minute" double precision NOT NULL,
	"guild_id" text,
	CONSTRAINT "events_name_category_unique" UNIQUE("name","category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eventsmodes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"is_hired" boolean DEFAULT true NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"permission_role" integer DEFAULT 1 NOT NULL,
	"preferred_language" text DEFAULT 'en-US' NOT NULL,
	"total_time" bigint DEFAULT 0 NOT NULL,
	"weekly_time" bigint DEFAULT 0 NOT NULL,
	"total_salary" bigint DEFAULT 0 NOT NULL,
	"weekly_salary" bigint DEFAULT 0 NOT NULL,
	"hearts" bigint DEFAULT 0 NOT NULL,
	"favorite_event" text DEFAULT 'none' NOT NULL,
	"longest_event" bigint DEFAULT 0 NOT NULL,
	"hired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventsmodes_user_id_guild_id_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_event_bans" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"reason" text NOT NULL,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"executor_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"guild_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guild_logger" (
	"id" text PRIMARY KEY NOT NULL,
	"is_configured" boolean DEFAULT false NOT NULL,
	"guild_to_log" text,
	"channel_to_log" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"preferred_language" text DEFAULT 'en-US' NOT NULL,
	"proto_settings" jsonb DEFAULT '{"general":{"minimumWeeklyQuota":300},"roles":{"adminRoleId":null,"moderatorRoleId":null,"curatorRoleId":null,"coachRoleId":null,"eventsmodeRoleId":null},"channels":{"eventCategoryId":null,"announceEventChannelId":null,"startedEventCategoryId":null},"features":{"eventAnnouncement":false,"eventAutoPayment":false,"eventActiveCategory":false}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text,
	"reputation_score" bigint DEFAULT 100 NOT NULL,
	"total_event_time" bigint DEFAULT 0 NOT NULL,
	"favorite_event" text DEFAULT 'none' NOT NULL,
	CONSTRAINT "users_user_id_guild_id_unique" UNIQUE("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warns" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"is_verbal" boolean NOT NULL,
	"reason" text NOT NULL,
	"warned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guild_id" text,
	"executor_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_activities" ADD CONSTRAINT "event_activities_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_activities" ADD CONSTRAINT "event_activities_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_activities" ADD CONSTRAINT "event_activities_eventsmode_id_eventsmodes_id_fk" FOREIGN KEY ("eventsmode_id") REFERENCES "public"."eventsmodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_executor_id_eventsmodes_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."eventsmodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_history" ADD CONSTRAINT "event_history_eventsmode_id_eventsmodes_id_fk" FOREIGN KEY ("eventsmode_id") REFERENCES "public"."eventsmodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_history" ADD CONSTRAINT "event_history_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_history" ADD CONSTRAINT "event_history_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventsmodes" ADD CONSTRAINT "eventsmodes_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "global_event_bans" ADD CONSTRAINT "global_event_bans_executor_id_eventsmodes_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."eventsmodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "global_event_bans" ADD CONSTRAINT "global_event_bans_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "global_event_bans" ADD CONSTRAINT "global_event_bans_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guild_logger" ADD CONSTRAINT "guild_logger_id_guilds_id_fk" FOREIGN KEY ("id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warns" ADD CONSTRAINT "warns_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warns" ADD CONSTRAINT "warns_executor_id_eventsmodes_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."eventsmodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warns" ADD CONSTRAINT "warns_target_id_eventsmodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."eventsmodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventsmodes_user_id_index" ON "eventsmodes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventsmodes_guild_id_index" ON "eventsmodes" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_user_id_index" ON "users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_guild_id_index" ON "users" USING btree ("guild_id");