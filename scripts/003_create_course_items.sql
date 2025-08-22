-- Create course items table (videos, readings, assignments, quizzes)
create table if not exists public.course_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  item_type text not null check (item_type in ('video', 'reading', 'assignment', 'quiz', 'other')),
  content_url text, -- YouTube video URL, document link, etc.
  duration_minutes integer, -- For videos or estimated reading time
  order_index integer not null default 0,
  metadata jsonb, -- Store additional data like video ID, quiz questions, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.course_items enable row level security;

-- Create policies for course items
create policy "Users can view their own course items"
  on public.course_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own course items"
  on public.course_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own course items"
  on public.course_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own course items"
  on public.course_items for delete
  using (auth.uid() = user_id);

-- Create index for ordering
create index if not exists course_items_order_idx on public.course_items(course_id, order_index);
