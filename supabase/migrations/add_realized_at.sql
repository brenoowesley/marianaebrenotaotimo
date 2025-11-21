-- Add realized_at column to store when an item was completed
ALTER TABLE items ADD COLUMN realized_at DATE;

-- Add comment for clarity
COMMENT ON COLUMN items.realized_at IS 'Date when the item status was changed to realized';
