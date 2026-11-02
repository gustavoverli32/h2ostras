CREATE TABLE `h2ostras_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`author_email` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`route` text NOT NULL,
	`page_title` text NOT NULL,
	`element` text NOT NULL,
	`selection` text NOT NULL,
	`image` text,
	`status` text DEFAULT 'Recebido' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_author_date` ON `h2ostras_feedback` (`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_status_date` ON `h2ostras_feedback` (`status`,`created_at`);