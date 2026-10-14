CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`day` text NOT NULL,
	`data` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item` text NOT NULL,
	`cost` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`guest` text,
	`host_name` text NOT NULL,
	`guest_name` text,
	`starts` integer,
	`expires` integer NOT NULL,
	`host_made` integer DEFAULT 0 NOT NULL,
	`host_attempts` integer DEFAULT 0 NOT NULL,
	`guest_made` integer DEFAULT 0 NOT NULL,
	`guest_attempts` integer DEFAULT 0 NOT NULL
);
