PRAGMA foreign_keys=OFF;

CREATE TABLE stock_reservation_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL,
    product_variant_id TEXT REFERENCES product_variant(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES product(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    expires_at INTEGER NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Copy data from existing table
-- We check if product_id exists first to avoid errors if it was partially added
-- But from PRAGMA we know it is there.
INSERT INTO stock_reservation_new (id, order_id, product_variant_id, product_id, quantity, expires_at, confirmed, created_at, updated_at)
SELECT id, order_id, product_variant_id, product_id, quantity, expires_at, confirmed, created_at, updated_at FROM stock_reservation;

DROP TABLE stock_reservation;
ALTER TABLE stock_reservation_new RENAME TO stock_reservation;

CREATE INDEX IF NOT EXISTS idx_stock_reservation_expires ON stock_reservation(expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservation_order ON stock_reservation(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservation_variant ON stock_reservation(product_variant_id, confirmed);

PRAGMA foreign_keys=ON;
