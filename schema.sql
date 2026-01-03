-- Create a table for public profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  employee_id text,
  role text check (role in ('Employee', 'HR')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a table for leave requests
create table public.leave_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_requests enable row level security;

-- Policies for leave requests
create policy "Users can view their own leave requests." on public.leave_requests
  for select using (auth.uid() = user_id);

create policy "HR can view all leave requests." on public.leave_requests
  for select using (auth.jwt() ->> 'role' = 'HR' OR exists (
    select 1 from public.profiles where id = auth.uid() and role = 'HR'
  ));

create policy "Users can insert their own leave requests." on public.leave_requests
  for insert with check (auth.uid() = user_id);

create policy "HR can update leave requests (Approve/Reject)." on public.leave_requests
  for update using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'HR'
  ));

-- Create a table for attendance (Check-in/Check-out)
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.attendance enable row level security;

-- Policies for attendance
create policy "Users can view their own attendance." on public.attendance
  for select using (auth.uid() = user_id);

create policy "Users can insert their own attendance (Check-in)." on public.attendance
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own attendance (Check-out)." on public.attendance
  for update using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, employee_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'employee_id',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$ language plpgsql security definer;
-- Trigger to call the function on creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();