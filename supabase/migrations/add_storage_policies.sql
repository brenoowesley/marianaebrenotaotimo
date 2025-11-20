-- Migration: Add storage policies for category-covers bucket
-- Run this AFTER creating the 'category-covers' bucket in Supabase Dashboard
-- This file contains ONLY the new changes, not the full schema

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'category-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
