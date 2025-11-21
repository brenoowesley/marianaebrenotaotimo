-- Migration: Update rating column to support fractional values (e.g., 3.5 stars)
-- This changes the rating from INTEGER to DECIMAL(2,1)

-- Remove old constraint
ALTER TABLE items 
DROP CONSTRAINT IF EXISTS items_rating_check;

-- Change column type to DECIMAL(2,1) to support values like 3.5
ALTER TABLE items 
ALTER COLUMN rating TYPE DECIMAL(2,1);

-- Add new constraint for 0.5 to 5.0 range
ALTER TABLE items 
ADD CONSTRAINT items_rating_check CHECK (rating >= 0.5 AND rating <= 5.0);
