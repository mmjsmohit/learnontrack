-- Create notes table for course items
create table if not exists public.course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_item_id uuid not null references public.course_items(id) on delete cascade,
  title text,
  content text not null,
  timestamp_seconds integer, -- For video notes, timestamp in seconds
  is_private boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.course_notes enable row level security;

-- Create policies for course notes
create policy "Users can view their own notes"
  on public.course_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.course_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.course_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.course_notes for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists course_notes_course_item_idx on public.course_notes(course_item_id);
create index if not exists course_notes_timestamp_idx on public.course_notes(timestamp_seconds) where timestamp_seconds is not null;
