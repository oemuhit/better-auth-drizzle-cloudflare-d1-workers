-- Create ticket table
CREATE TABLE IF NOT EXISTS ticket (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES "order"(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
    updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

-- Create ticket_message table
CREATE TABLE IF NOT EXISTS ticket_message (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticket_id TEXT NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticket_user ON ticket(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_order ON ticket(order_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON ticket(status);
CREATE INDEX IF NOT EXISTS idx_ticket_message_ticket ON ticket_message(ticket_id);
