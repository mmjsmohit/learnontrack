-- Create function to handle updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create triggers for updated_at timestamps
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger courses_updated_at
  before update on public.courses
  for each row
  execute function public.handle_updated_at();

create trigger course_items_updated_at
  before update on public.course_items
  for each row
  execute function public.handle_updated_at();

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function public.handle_updated_at();

create trigger course_notes_updated_at
  before update on public.course_notes
  for each row
  execute function public.handle_updated_at();

-- Create function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger for new user profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
