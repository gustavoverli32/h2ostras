CREATE TABLE `h2ostras_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`password_tag` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `session_expiry` ON `h2ostras_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `h2ostras_login_attempts` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_expiry` ON `h2ostras_login_attempts` (`expires_at`);