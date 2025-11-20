-- Add cover_position column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS cover_position INTEGER DEFAULT 50;

-- Comment explaining the column
COMMENT ON COLUMN categories.cover_position IS 
'Vertical position percentage (0-100) for cover image positioning. Used with CSS object-position.';
