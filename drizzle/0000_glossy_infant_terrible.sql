CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `attribute_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'select' NOT NULL,
	`options` text DEFAULT '[]',
	`description` text,
	`icon` text,
	`sort` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `attribute_template_name_unique` ON `attribute_template` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cart` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `cart_user_id_unique` ON `cart` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cart_user_idx` ON `cart` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cart_item` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_variant_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cart_item_cart_idx` ON `cart_item` (`cart_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cart_item_product_idx` ON `cart_item` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `category` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image` text,
	`parent_category_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`parent_category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `category_slug_unique` ON `category` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `category_slug_idx` ON `category` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `category_parent_idx` ON `category` (`parent_category_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coupon` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `coupon_code_unique` ON `coupon` (`code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_coupon_code` ON `coupon` (`code`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_coupon_active` ON `coupon` (`is_active`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coupon_usage` (
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
CREATE INDEX IF NOT EXISTS `idx_coupon_usage_coupon` ON `coupon_usage` (`coupon_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_coupon_usage_user` ON `coupon_usage` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_coupon_usage_order` ON `coupon_usage` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customer_address` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`city` text NOT NULL,
	`city_code` text,
	`state` text,
	`district` text,
	`postal_code` text NOT NULL,
	`country_code` text DEFAULT 'TR' NOT NULL,
	`phone` text,
	`is_shipping` integer DEFAULT true NOT NULL,
	`is_billing` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `address_user_idx` ON `customer_address` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`fulfillment_status` text DEFAULT 'open' NOT NULL,
	`payment_status` text DEFAULT 'not_paid' NOT NULL,
	`shipping_address_snapshot` text,
	`billing_address_snapshot` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`shipping_total` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`notes` text,
	`geliver_shipment_id` text,
	`tracking_number` text,
	`barcode` text,
	`tracking_url` text,
	`label_url` text,
	`transaction_id` text,
	`amount_charged` text,
	`currency` text,
	`return_shipment_id` text,
	`return_barcode` text,
	`return_label_url` text,
	`coupon_code` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`completed_at` integer,
	`cancelled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `order_order_number_unique` ON `order` (`order_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_user_idx` ON `order` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_number_idx` ON `order` (`order_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_status_idx` ON `order` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_variant_id` text,
	`product_title` text NOT NULL,
	`variant_info` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` real NOT NULL,
	`subtotal` real NOT NULL,
	`total` real NOT NULL,
	`sort` integer DEFAULT 0,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_item_order_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_item_product_idx` ON `order_item` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`short_description` text,
	`thumbnail` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`category_id` text,
	`tax_rate_id` text,
	`variant_attributes` text DEFAULT '{}',
	`meta_title` text,
	`meta_description` text,
	`base_price` real DEFAULT 0,
	`compare_at_price` real,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_new` integer DEFAULT false NOT NULL,
	`track_inventory` integer DEFAULT true NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`sort` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rate`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `product_slug_unique` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_slug_idx` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_category_idx` ON `product` (`category_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_status_idx` ON `product` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_featured_idx` ON `product` (`is_featured`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`sort` integer DEFAULT 0,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_image_product_idx` ON `product_image` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text,
	`barcode` text,
	`price` real DEFAULT 0 NOT NULL,
	`compare_at_price` real,
	`cost_price` real,
	`attributes` text DEFAULT '{}',
	`weight` real,
	`weight_unit` text DEFAULT 'g',
	`length` real,
	`width` real,
	`height` real,
	`dimension_unit` text DEFAULT 'cm',
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5,
	`allow_backorder` integer DEFAULT false NOT NULL,
	`image` text,
	`images` text DEFAULT '[]',
	`is_active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `product_variant_sku_unique` ON `product_variant` (`sku`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `variant_product_idx` ON `product_variant` (`product_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `variant_sku_idx` ON `product_variant` (`sku`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `variant_barcode_idx` ON `product_variant` (`barcode`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stock_reservation` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_variant_id` text,
	`product_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL,
	`confirmed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_stock_reservation_expires` ON `stock_reservation` (`expires_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_stock_reservation_order` ON `stock_reservation` (`order_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_stock_reservation_variant` ON `stock_reservation` (`product_variant_id`,`confirmed`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_stock_reservation_product` ON `stock_reservation` (`product_id`,`confirmed`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tax_rate` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`code` text NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tax_rate_code_unique` ON `tax_rate` (`code`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ticket` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text,
	`subject` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ticket_user` ON `ticket` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ticket_order` ON `ticket` (`order_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ticket_status` ON `ticket` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ticket_message` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`message` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `ticket`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ticket_message_ticket` ON `ticket_message` (`ticket_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `wishlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `wishlist_user_idx` ON `wishlist` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `wishlist_product_idx` ON `wishlist` (`product_id`);