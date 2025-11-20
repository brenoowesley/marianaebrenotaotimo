-- Migration: Add item_photo_url and rating to items table
-- Run this in Supabase SQL Editor

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS item_photo_url TEXT,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
