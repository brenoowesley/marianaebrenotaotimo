-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  icon text,
  cover_image_url text,
  template_schema jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;

create policy "Users can view their own categories." on categories
  for select using (auth.uid() = user_id);

create policy "Users can insert their own categories." on categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own categories." on categories
  for update using (auth.uid() = user_id);

create policy "Users can delete their own categories." on categories
  for delete using (auth.uid() = user_id);

-- Create a table for items
create table items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  title text not null,
  status text default 'To Do',
  properties_value jsonb default '{}'::jsonb,
  notes text,
  item_photo_url text,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table items enable row level security;

create policy "Users can view their own items." on items
  for select using (auth.uid() = user_id);

create policy "Users can insert their own items." on items
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own items." on items
  for update using (auth.uid() = user_id);

create policy "Users can delete their own items." on items
  for delete using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage policies for category-covers bucket
-- Note: You must create the 'category-covers' bucket in Supabase Dashboard first
-- Settings: Private bucket, 10MB max file size

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
