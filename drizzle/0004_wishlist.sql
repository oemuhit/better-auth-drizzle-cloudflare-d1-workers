-- Wishlist Table
CREATE TABLE `wishlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wishlist_user_idx` ON `wishlist` (`user_id`);
--> statement-breakpoint
CREATE INDEX `wishlist_product_idx` ON `wishlist` (`product_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlist_user_product_unique` ON `wishlist` (`user_id`, `product_id`);
