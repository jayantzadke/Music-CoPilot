CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"provider" varchar(20) DEFAULT 'local' NOT NULL,
	"provider_id" varchar(255),
	"preferred_lang" varchar(20) DEFAULT 'hindi' NOT NULL,
	"audio_quality" varchar(10) DEFAULT '320kbps' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"device_info" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"cover_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"song_count" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playlist_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL,
	"song_id" varchar(50) NOT NULL,
	"song_name" varchar(300) NOT NULL,
	"song_image" text,
	"song_artists" varchar(500) NOT NULL,
	"song_duration" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "liked_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"song_id" varchar(50) NOT NULL,
	"song_name" varchar(300) NOT NULL,
	"song_image" text,
	"song_artists" varchar(500) NOT NULL,
	"song_duration" integer DEFAULT 0 NOT NULL,
	"album_id" varchar(50),
	"liked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "followed_artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"artist_id" varchar(50) NOT NULL,
	"artist_name" varchar(200) NOT NULL,
	"artist_image" text,
	"followed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "play_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"song_id" varchar(50) NOT NULL,
	"song_name" varchar(300) NOT NULL,
	"song_image" text,
	"song_artists" varchar(500) NOT NULL,
	"album_id" varchar(50),
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"play_duration" integer,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" varchar(255) NOT NULL,
	"result_type" varchar(20),
	"result_id" varchar(50),
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_songs" ADD CONSTRAINT "liked_songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followed_artists" ADD CONSTRAINT "followed_artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlists_user_id_idx" ON "playlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlists_is_public_idx" ON "playlists" USING btree ("is_public") WHERE "playlists"."is_public" = true;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "playlist_songs_playlist_song_unique" ON "playlist_songs" USING btree ("playlist_id","song_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlist_songs_playlist_id_idx" ON "playlist_songs" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playlist_songs_position_idx" ON "playlist_songs" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "liked_songs_user_song_unique" ON "liked_songs" USING btree ("user_id","song_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "liked_songs_user_liked_at_idx" ON "liked_songs" USING btree ("user_id","liked_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "followed_artists_user_artist_unique" ON "followed_artists" USING btree ("user_id","artist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "followed_artists_user_id_idx" ON "followed_artists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "play_history_user_played_at_idx" ON "play_history" USING btree ("user_id","played_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "play_history_song_id_idx" ON "play_history" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_history_user_searched_at_idx" ON "search_history" USING btree ("user_id","searched_at");