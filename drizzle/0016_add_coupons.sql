-- Create coupon table
CREATE TABLE `coupon` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`min_purchase_amount` real DEFAULT 0,
	`start_date` integer,
	`end_date` integer,
	`is_new_user_only` integer DEFAULT false NOT NULL,
	`is_first_purchase_only` integer DEFAULT false NOT NULL,
	`usage_limit_per_user` integer DEFAULT 1,
	`usage_limit_total` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_code_unique` ON `coupon` (`code`);
--> statement-breakpoint
CREATE INDEX `idx_coupon_code` ON `coupon` (`code`);
--> statement-breakpoint
CREATE INDEX `idx_coupon_active` ON `coupon` (`is_active`);
--> statement-breakpoint

-- Create coupon_usage table
CREATE TABLE `coupon_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_id` text NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text NOT NULL,
	`discount_amount` real NOT NULL,
	`used_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupon`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_coupon_usage_coupon` ON `coupon_usage` (`coupon_id`);
--> statement-breakpoint
CREATE INDEX `idx_coupon_usage_user` ON `coupon_usage` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_coupon_usage_order` ON `coupon_usage` (`order_id`);
--> statement-breakpoint

-- Add coupon_code to order table
ALTER TABLE `order` ADD COLUMN `coupon_code` text;
