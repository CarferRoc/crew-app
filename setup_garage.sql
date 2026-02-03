 -- Create 'garaje' table
create table if not exists public.garaje (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  nickname text,
  power text,
  specs text,
  photos text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.garaje enable row level security;

-- Policies
create policy "Public can view garage cars"
on public.garaje for select
using ( true );

create policy "Users can insert their own cars"
on public.garaje for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own cars"
on public.garaje for update
using ( auth.uid() = user_id );

create policy "Users can delete their own cars"
on public.garaje for delete
using ( auth.uid() = user_id );

-- Storage bucket for garage photos (if not exists)
insert into storage.buckets (id, name, public) 
values ('garage-photos', 'garage-photos', true)
on conflict (id) do nothing;

create policy "Public Access Garage Photos"
on storage.objects for select
using ( bucket_id = 'garage-photos' );

create policy "Authenticated users can upload garage photos"
on storage.objects for insert
with check (
  bucket_id = 'garage-photos' 
  and auth.role() = 'authenticated'
);
