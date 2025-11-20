-- Migration: Add cover_image_url to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
