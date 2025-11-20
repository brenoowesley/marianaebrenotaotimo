-- Add order_index column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS order_index DOUBLE PRECISION DEFAULT 0;

-- Create a function to set the initial order_index for new items
CREATE OR REPLACE FUNCTION set_initial_order_index()
RETURNS TRIGGER AS $$
BEGIN
  -- Set order_index to max(order_index) + 1000 for the same category
  -- If no items exist, start at 1000
  SELECT COALESCE(MAX(order_index), 0) + 1000
  INTO NEW.order_index
  FROM items
  WHERE category_id = NEW.category_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_initial_order_index ON items;
CREATE TRIGGER trigger_set_initial_order_index
BEFORE INSERT ON items
FOR EACH ROW
EXECUTE FUNCTION set_initial_order_index();
