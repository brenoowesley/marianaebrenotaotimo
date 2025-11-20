# Supabase Storage Setup Instructions

## Step 1: Create Storage Bucket (Required - Manual Step)

**You must do this in Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name**: `category-covers`
   - **Public bucket**: ❌ **OFF** (Private - only authenticated users)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: `image/*` (or specific: `image/jpeg,image/png,image/webp,image/gif`)
5. Click **"Create bucket"**

## Step 2: Apply Storage Policies (Already in schema.sql)

The RLS policies are already added to your `schema.sql` file. They will:
- Allow authenticated users to upload images to their own folder (`user_id/filename`)
- Allow authenticated users to read/update/delete only their own images
- Prevent unauthorized access

## Step 3: Run Migration (After bucket creation)

After creating the bucket, run the storage policies from `schema.sql`:

```sql
-- These are already in your schema.sql, run them in Supabase SQL Editor
-- (Lines 87-123 of schema.sql)
```

## Bucket Structure

Images will be organized by user:
```
category-covers/
├── user-uuid-1/
│   ├── random-id-1.jpg
│   └── random-id-2.png
├── user-uuid-2/
│   └── random-id-3.webp
```

## File Constraints

- **Max size**: 10MB
- **Allowed types**: image/jpeg, image/png, image/webp, image/gif
- **Access**: Authenticated users only (can only see their own images)
