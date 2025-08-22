-- Create progress tracking table
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_item_id uuid not null references public.course_items(id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  time_spent_minutes integer default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_item_id)
);

-- Enable RLS
alter table public.user_progress enable row level security;

-- Create policies for user progress
create policy "Users can view their own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own progress"
  on public.user_progress for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists user_progress_user_course_idx on public.user_progress(user_id, course_id);
create index if not exists user_progress_status_idx on public.user_progress(status);
