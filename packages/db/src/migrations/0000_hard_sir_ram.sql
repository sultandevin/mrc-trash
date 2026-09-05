CREATE TABLE `admin_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`road_name` text,
	`block` text,
	`rt` text,
	`rw` text,
	`methods` text NOT NULL,
	`other_method` text,
	`created_at` text NOT NULL
);
