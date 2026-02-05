-- Migration: Add address snapshots to orders
-- This migration adds snapshot columns to store address information at the time of order

ALTER TABLE `order` ADD `shipping_address_snapshot` text;
--> statement-breakpoint
ALTER TABLE `order` ADD `billing_address_snapshot` text;
