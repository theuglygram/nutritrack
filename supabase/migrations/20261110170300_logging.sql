-- Logging: food, weight and water entries.
-- Entries carry their own date and meal slot (no parent meal row) so offline devices can
-- sync independently without conflicting on a shared parent (ADR-018, ADR-029).
-- Ids may be generated on the client so replayed syncs are idempotent upserts.

create table public.food_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  meal_slot public.meal_slot not null,
  food_id uuid not null references public.foods (id),
  serving_unit_id uuid not null references public.serving_units (id),
  quantity numeric(8, 2) not null check (quantity > 0 and quantity <= 10000),
  entry_method public.entry_method not null default 'manual',
  ai_candidate_id uuid, -- foreign key added in the AI migration
  -- Snapshot, computed by trigger from the catalogue at log time (ADR-011, ADR-029).
  -- Clients never set these; any supplied values are overwritten.
  food_name text not null,
  grams numeric(10, 2) not null check (grams > 0),
  energy_kcal numeric(10, 2),
  protein_g numeric(10, 2),
  carbs_g numeric(10, 2),
  fat_g numeric(10, 2),
  fibre_g numeric(10, 2),
  sugar_g numeric(10, 2),
  sodium_mg numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_log_entries_user_date_idx on public.food_log_entries (user_id, log_date);
create index food_log_entries_food_idx on public.food_log_entries (food_id);

-- Deterministic snapshot (ADR-006). Mirrors packages/core:
--   grams    = round(quantity × grams_per_unit, 2)
--   nutrient = round(per_100g × grams / 100, 2), null stays null
-- numeric round() is exact decimal and rounds half away from zero, matching core's roundTo().
-- Security invoker: the food lookup obeys foods RLS, so users can only log foods they can see.
create function public.compute_food_log_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_food_name text;
  v_unit_grams numeric;
  v_grams numeric;
  n public.food_nutrients%rowtype;
begin
  if tg_op = 'UPDATE'
     and new.food_id is not distinct from old.food_id
     and new.serving_unit_id is not distinct from old.serving_unit_id
     and new.quantity is not distinct from old.quantity then
    -- Portion unchanged: keep the original snapshot even if the catalogue has changed since.
    new.food_name := old.food_name;
    new.grams := old.grams;
    new.energy_kcal := old.energy_kcal;
    new.protein_g := old.protein_g;
    new.carbs_g := old.carbs_g;
    new.fat_g := old.fat_g;
    new.fibre_g := old.fibre_g;
    new.sugar_g := old.sugar_g;
    new.sodium_mg := old.sodium_mg;
    return new;
  end if;

  select f.name into v_food_name from public.foods f where f.id = new.food_id;
  if not found then
    raise exception 'Food % does not exist or is not available', new.food_id
      using errcode = '23503';
  end if;

  select coalesce(su.grams_per_unit, fs.grams)
    into v_unit_grams
    from public.serving_units su
    left join public.food_servings fs
      on fs.serving_unit_id = su.id and fs.food_id = new.food_id
   where su.id = new.serving_unit_id;
  if v_unit_grams is null then
    raise exception 'Serving unit % has no gram weight defined for food %',
      new.serving_unit_id, new.food_id
      using errcode = '23514';
  end if;

  v_grams := round(new.quantity * v_unit_grams, 2);

  select * into n from public.food_nutrients where food_id = new.food_id;

  new.food_name := v_food_name;
  new.grams := v_grams;
  new.energy_kcal := round(n.energy_kcal * v_grams / 100, 2);
  new.protein_g := round(n.protein_g * v_grams / 100, 2);
  new.carbs_g := round(n.carbs_g * v_grams / 100, 2);
  new.fat_g := round(n.fat_g * v_grams / 100, 2);
  new.fibre_g := round(n.fibre_g * v_grams / 100, 2);
  new.sugar_g := round(n.sugar_g * v_grams / 100, 2);
  new.sodium_mg := round(n.sodium_mg * v_grams / 100, 2);
  return new;
end;
$$;

grant execute on function public.compute_food_log_snapshot() to authenticated, service_role;

create trigger food_log_entries_snapshot
  before insert or update on public.food_log_entries
  for each row execute function public.compute_food_log_snapshot();

create trigger food_log_entries_set_updated_at
  before update on public.food_log_entries
  for each row execute function public.set_updated_at();

alter table public.food_log_entries enable row level security;

create policy "food_log_entries: owner reads" on public.food_log_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "food_log_entries: owner inserts" on public.food_log_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "food_log_entries: owner updates" on public.food_log_entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "food_log_entries: owner deletes" on public.food_log_entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- Weight ---------------------------------------------------------------------

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create trigger weight_entries_set_updated_at
  before update on public.weight_entries
  for each row execute function public.set_updated_at();

alter table public.weight_entries enable row level security;

create policy "weight_entries: owner reads" on public.weight_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "weight_entries: owner inserts" on public.weight_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "weight_entries: owner updates" on public.weight_entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "weight_entries: owner deletes" on public.weight_entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- Water ----------------------------------------------------------------------

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml between 1 and 5000),
  unit_label text check (char_length(unit_label) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index water_entries_user_logged_idx on public.water_entries (user_id, logged_at);

create trigger water_entries_set_updated_at
  before update on public.water_entries
  for each row execute function public.set_updated_at();

alter table public.water_entries enable row level security;

create policy "water_entries: owner reads" on public.water_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "water_entries: owner inserts" on public.water_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "water_entries: owner updates" on public.water_entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "water_entries: owner deletes" on public.water_entries
  for delete to authenticated using (user_id = (select auth.uid()));
