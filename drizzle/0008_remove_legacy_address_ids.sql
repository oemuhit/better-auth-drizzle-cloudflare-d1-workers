PRAGMA foreign_keys = OFF;

CREATE TABLE `order_new` (
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
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    `completed_at` integer,
    `cancelled_at` integer,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `order_new` (
    `id`, `order_number`, `user_id`, `status`, `fulfillment_status`, `payment_status`,
    `shipping_address_snapshot`, `billing_address_snapshot`,
    `subtotal`, `tax_total`, `shipping_total`, `discount_total`, `total`,
    `notes`, `created_at`, `updated_at`, `completed_at`, `cancelled_at`
)
SELECT
    `id`, `order_number`, `user_id`, `status`, `fulfillment_status`, `payment_status`,
    `shipping_address_snapshot`, `billing_address_snapshot`,
    `subtotal`, `tax_total`, `shipping_total`, `discount_total`, `total`,
    `notes`, `created_at`, `updated_at`, `completed_at`, `cancelled_at`
FROM `order`;

DROP TABLE `order`;

ALTER TABLE `order_new` RENAME TO `order`;

CREATE INDEX `order_user_idx` ON `order` (`user_id`);
CREATE INDEX `order_number_idx` ON `order` (`order_number`);
CREATE INDEX `order_status_idx` ON `order` (`status`);

PRAGMA foreign_keys = ON;
