-- E-commerce Schema Migration
-- Categories Table
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`parent_category_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`parent_category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_unique` ON `category` (`slug`);
--> statement-breakpoint
CREATE INDEX `category_slug_idx` ON `category` (`slug`);
--> statement-breakpoint
CREATE INDEX `category_parent_idx` ON `category` (`parent_category_id`);
--> statement-breakpoint

-- Products Table
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`thumbnail` text,
	`status` text DEFAULT 'active' NOT NULL,
	`category_id` text,
	`colors` text DEFAULT '[]',
	`sizes` text DEFAULT '[]',
	`sort` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);
--> statement-breakpoint
CREATE INDEX `product_slug_idx` ON `product` (`slug`);
--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `product` (`category_id`);
--> statement-breakpoint
CREATE INDEX `product_status_idx` ON `product` (`status`);
--> statement-breakpoint

-- Product Variants Table
CREATE TABLE `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text,
	`price` real DEFAULT 0 NOT NULL,
	`compare_at_price` real,
	`color` text,
	`size` text,
	`weight` real,
	`weight_unit` text DEFAULT 'g',
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variant_sku_unique` ON `product_variant` (`sku`);
--> statement-breakpoint
CREATE INDEX `variant_product_idx` ON `product_variant` (`product_id`);
--> statement-breakpoint
CREATE INDEX `variant_sku_idx` ON `product_variant` (`sku`);
--> statement-breakpoint

-- Product Images Table
CREATE TABLE `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`sort` integer DEFAULT 0,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_image_product_idx` ON `product_image` (`product_id`);
--> statement-breakpoint

-- Customer Addresses Table
CREATE TABLE `customer_address` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`city` text NOT NULL,
	`state` text,
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
CREATE INDEX `address_user_idx` ON `customer_address` (`user_id`);
--> statement-breakpoint

-- Orders Table
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`fulfillment_status` text DEFAULT 'open' NOT NULL,
	`payment_status` text DEFAULT 'not_paid' NOT NULL,
	`billing_address_id` text,
	`shipping_address_id` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`shipping_total` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`completed_at` integer,
	`cancelled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`billing_address_id`) REFERENCES `customer_address`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `customer_address`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_order_number_unique` ON `order` (`order_number`);
--> statement-breakpoint
CREATE INDEX `order_user_idx` ON `order` (`user_id`);
--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `order` (`order_number`);
--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `order` (`status`);
--> statement-breakpoint

-- Order Items Table
CREATE TABLE `order_item` (
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
CREATE INDEX `order_item_order_idx` ON `order_item` (`order_id`);
--> statement-breakpoint
CREATE INDEX `order_item_product_idx` ON `order_item` (`product_id`);
--> statement-breakpoint

-- Cart Table
CREATE TABLE `cart` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_user_id_unique` ON `cart` (`user_id`);
--> statement-breakpoint
CREATE INDEX `cart_user_idx` ON `cart` (`user_id`);
--> statement-breakpoint

-- Cart Items Table
CREATE TABLE `cart_item` (
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
CREATE INDEX `cart_item_cart_idx` ON `cart_item` (`cart_id`);
--> statement-breakpoint
CREATE INDEX `cart_item_product_idx` ON `cart_item` (`product_id`);
