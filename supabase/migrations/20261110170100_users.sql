-- Users: profiles, roles, goals.

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  sex public.sex,
  date_of_birth date check (date_of_birth >= date '1900-01-01'),
  height_cm numeric(5, 1) check (height_cm between 50 and 272),
  activity_level public.activity_level,
  onboarding_completed_at timestamptz,
  -- ADR-021: explicit consent to processing of health data, and opt-in for photo evaluation.
  health_data_consent_at timestamptz,
  consent_version text check (char_length(consent_version) <= 20),
  photo_evaluation_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user, created by trigger on sign-up.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Create a profile for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roles ----------------------------------------------------------------------

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Granted only with the service role (no write policies).';

alter table public.user_roles enable row level security;

-- security definer so policies on other tables can call it without exposing user_roles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create policy "user_roles: read own or admin"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Goals (history: rows are never updated; the latest effective row is active) --

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_type public.goal_type not null,
  target_weight_kg numeric(5, 2) check (target_weight_kg between 20 and 400),
  target_rate_kg_per_week numeric(4, 2) check (target_rate_kg_per_week between 0 and 2),
  -- Broad sanity bounds only. Safety floors (ADR-024) are enforced in packages/core.
  calorie_target integer not null check (calorie_target between 500 and 10000),
  protein_g integer not null check (protein_g between 0 and 1000),
  carbs_g integer not null check (carbs_g between 0 and 2000),
  fat_g integer not null check (fat_g between 0 and 1000),
  water_ml integer not null check (water_ml between 0 and 10000),
  is_override boolean not null default false,
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);

create index user_goals_user_effective_idx
  on public.user_goals (user_id, effective_from desc, created_at desc);

alter table public.user_goals enable row level security;

create policy "user_goals: owner can read"
  on public.user_goals for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_goals: owner can insert"
  on public.user_goals for insert to authenticated
  with check (user_id = (select auth.uid()));
