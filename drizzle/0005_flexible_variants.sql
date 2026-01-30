-- Migration: Flexible Variant Attributes System
-- Adds support for custom product attributes beyond just color/size

-- ============================================================================
-- TAX RATES TABLE
-- ============================================================================
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
CREATE UNIQUE INDEX IF NOT EXISTS `tax_rate_code_unique` ON `tax_rate` (`code`);
--> statement-breakpoint

-- ============================================================================
-- CATEGORY TABLE UPDATES
-- ============================================================================
ALTER TABLE `category` ADD COLUMN `description` text;
--> statement-breakpoint
ALTER TABLE `category` ADD COLUMN `image` text;
--> statement-breakpoint

-- ============================================================================
-- PRODUCT TABLE UPDATES
-- ============================================================================
ALTER TABLE `product` ADD COLUMN `short_description` text;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `tax_rate_id` text REFERENCES `tax_rate`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `variant_attributes` text DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `meta_title` text;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `meta_description` text;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `base_price` real DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `compare_at_price` real;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `is_featured` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `is_new` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `product` ADD COLUMN `track_inventory` integer DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_featured_idx` ON `product` (`is_featured`);
--> statement-breakpoint

-- ============================================================================
-- PRODUCT VARIANT TABLE UPDATES
-- ============================================================================
ALTER TABLE `product_variant` ADD COLUMN `barcode` text;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `cost_price` real;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `attributes` text DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `length` real;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `width` real;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `height` real;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `dimension_unit` text DEFAULT 'cm';
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `low_stock_threshold` integer DEFAULT 5;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `allow_backorder` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `images` text DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `is_active` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `product_variant` ADD COLUMN `sort` integer DEFAULT 0;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `variant_barcode_idx` ON `product_variant` (`barcode`);
--> statement-breakpoint

-- ============================================================================
-- INSERT DEFAULT TAX RATES
-- ============================================================================
INSERT INTO `tax_rate` (`id`, `title`, `code`, `rate`, `is_default`, `is_active`) VALUES
('tax-kdv-18', 'KDV %18', 'KDV18', 18, true, true),
('tax-kdv-8', 'KDV %8', 'KDV8', 8, false, true),
('tax-kdv-1', 'KDV %1', 'KDV1', 1, false, true),
('tax-exempt', 'KDV Muaf', 'EXEMPT', 0, false, true);
