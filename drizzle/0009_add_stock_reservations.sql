-- 0009_add_stock_reservations.sql
-- Stock reservation table for preventing overselling

CREATE TABLE IF NOT EXISTS stock_reservation (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL,
    product_variant_id TEXT NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    expires_at INTEGER NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for cleanup of expired reservations
CREATE INDEX IF NOT EXISTS idx_stock_reservation_expires ON stock_reservation(expires_at);
-- Index for finding reservations by order
CREATE INDEX IF NOT EXISTS idx_stock_reservation_order ON stock_reservation(order_id);
-- Index for checking variant reservations
CREATE INDEX IF NOT EXISTS idx_stock_reservation_variant ON stock_reservation(product_variant_id, confirmed);
