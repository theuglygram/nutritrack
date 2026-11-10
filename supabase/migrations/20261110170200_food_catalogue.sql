-- Food catalogue. All nutrient values are per 100 g; null = unknown, never 0 (ADR-011).

-- Reference tables -----------------------------------------------------------

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 200),
  citation text,
  url text,
  licence text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cooking_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index cooking_methods_name_key on public.cooking_methods (lower(name));

create table public.serving_units (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  kind public.serving_unit_kind not null,
  -- Set only for universal conversions (gram = 1, kilogram = 1000).
  -- Null means the gram weight is food-specific and lives in food_servings.
  grams_per_unit numeric(10, 4) check (grams_per_unit > 0),
  created_at timestamptz not null default now()
);

create unique index serving_units_name_key on public.serving_units (lower(name));

-- Foods ----------------------------------------------------------------------

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text check (char_length(category) <= 60),
  cooking_method_id uuid references public.cooking_methods (id),
  is_composite boolean not null default false,
  recipe_yield_grams numeric(10, 2) check (recipe_yield_grams > 0),
  data_source_id uuid references public.data_sources (id),
  verification_status public.verification_status not null default 'unverified',
  -- Null = global catalogue food (admin-managed). Set = a user's private custom food.
  owner_user_id uuid references auth.users (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint foods_verified_requires_source
    check (verification_status <> 'verified' or data_source_id is not null),
  constraint foods_custom_are_unverified
    check (owner_user_id is null or verification_status = 'unverified')
);

create index foods_name_trgm_idx on public.foods using gin (name extensions.gin_trgm_ops);
create index foods_owner_idx on public.foods (owner_user_id) where owner_user_id is not null;

create table public.food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 120),
  language text not null default 'en' check (language in ('en', 'yo', 'ig', 'ha', 'pcm')),
  created_at timestamptz not null default now()
);

create unique index food_aliases_food_alias_key on public.food_aliases (food_id, lower(alias));
create index food_aliases_alias_trgm_idx on public.food_aliases using gin (alias extensions.gin_trgm_ops);

create table public.food_nutrients (
  food_id uuid primary key references public.foods (id) on delete cascade,
  -- Plausibility bounds per 100 g (pure fat ≈ 900 kcal; table salt ≈ 38,800 mg sodium).
  energy_kcal numeric(7, 2) check (energy_kcal between 0 and 900),
  protein_g numeric(5, 2) check (protein_g between 0 and 100),
  carbs_g numeric(5, 2) check (carbs_g between 0 and 100),
  fat_g numeric(5, 2) check (fat_g between 0 and 100),
  fibre_g numeric(5, 2) check (fibre_g between 0 and 100),
  sugar_g numeric(5, 2) check (sugar_g between 0 and 100),
  sodium_mg numeric(8, 2) check (sodium_mg between 0 and 40000),
  updated_at timestamptz not null default now()
);

create table public.food_servings (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  serving_unit_id uuid not null references public.serving_units (id),
  grams numeric(8, 2) not null check (grams > 0),
  is_estimate boolean not null default true,
  data_source_id uuid references public.data_sources (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (food_id, serving_unit_id),
  constraint food_servings_measured_requires_source
    check (is_estimate or data_source_id is not null)
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_food_id uuid not null references public.foods (id) on delete cascade,
  ingredient_food_id uuid not null references public.foods (id),
  grams numeric(8, 2) not null check (grams > 0),
  created_at timestamptz not null default now(),
  unique (recipe_food_id, ingredient_food_id),
  check (recipe_food_id <> ingredient_food_id)
);

create table public.food_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 20000),
  status public.submission_status not null default 'pending',
  reviewer_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_submissions_status_idx on public.food_submissions (status, created_at);

-- updated_at triggers --------------------------------------------------------

create trigger data_sources_set_updated_at before update on public.data_sources
  for each row execute function public.set_updated_at();
create trigger foods_set_updated_at before update on public.foods
  for each row execute function public.set_updated_at();
create trigger food_nutrients_set_updated_at before update on public.food_nutrients
  for each row execute function public.set_updated_at();
create trigger food_servings_set_updated_at before update on public.food_servings
  for each row execute function public.set_updated_at();
create trigger food_submissions_set_updated_at before update on public.food_submissions
  for each row execute function public.set_updated_at();

-- Access helpers ---------------------------------------------------------------

-- True when the current user may change a food and its child rows:
-- admins for global foods, owners for their own custom foods.
-- Security invoker: the lookup itself is subject to foods RLS.
create function public.can_edit_food(p_food_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.foods f
    where f.id = p_food_id
      and (
        (f.owner_user_id is null and public.is_admin())
        or f.owner_user_id = (select auth.uid())
      )
  );
$$;

grant execute on function public.can_edit_food(uuid) to authenticated, service_role;

-- RLS: reference tables (everyone signed in reads; admins write) --------------

alter table public.data_sources enable row level security;
alter table public.cooking_methods enable row level security;
alter table public.serving_units enable row level security;

create policy "data_sources: signed-in read" on public.data_sources
  for select to authenticated using (true);
create policy "data_sources: admin write" on public.data_sources
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "cooking_methods: signed-in read" on public.cooking_methods
  for select to authenticated using (true);
create policy "cooking_methods: admin write" on public.cooking_methods
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "serving_units: signed-in read" on public.serving_units
  for select to authenticated using (true);
create policy "serving_units: admin write" on public.serving_units
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS: foods -------------------------------------------------------------------

alter table public.foods enable row level security;

create policy "foods: read global (non-rejected unless admin) and own custom"
  on public.foods for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (owner_user_id is null and (verification_status <> 'rejected' or public.is_admin()))
  );

create policy "foods: admin creates global, user creates own custom"
  on public.foods for insert to authenticated
  with check (
    (owner_user_id is null and public.is_admin())
    or owner_user_id = (select auth.uid())
  );

create policy "foods: admin updates global, owner updates own custom"
  on public.foods for update to authenticated
  using (
    (owner_user_id is null and public.is_admin())
    or owner_user_id = (select auth.uid())
  )
  with check (
    (owner_user_id is null and public.is_admin())
    or owner_user_id = (select auth.uid())
  );

create policy "foods: admin deletes global, owner deletes own custom"
  on public.foods for delete to authenticated
  using (
    (owner_user_id is null and public.is_admin())
    or owner_user_id = (select auth.uid())
  );

-- RLS: food child tables (visibility and edit rights follow the parent food) ----

alter table public.food_aliases enable row level security;
alter table public.food_nutrients enable row level security;
alter table public.food_servings enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy "food_aliases: read when food visible" on public.food_aliases
  for select to authenticated
  using (exists (select 1 from public.foods f where f.id = food_id));
create policy "food_aliases: edit when food editable" on public.food_aliases
  for all to authenticated
  using (public.can_edit_food(food_id)) with check (public.can_edit_food(food_id));

create policy "food_nutrients: read when food visible" on public.food_nutrients
  for select to authenticated
  using (exists (select 1 from public.foods f where f.id = food_id));
create policy "food_nutrients: edit when food editable" on public.food_nutrients
  for all to authenticated
  using (public.can_edit_food(food_id)) with check (public.can_edit_food(food_id));

create policy "food_servings: read when food visible" on public.food_servings
  for select to authenticated
  using (exists (select 1 from public.foods f where f.id = food_id));
create policy "food_servings: edit when food editable" on public.food_servings
  for all to authenticated
  using (public.can_edit_food(food_id)) with check (public.can_edit_food(food_id));

create policy "recipe_ingredients: read when recipe visible" on public.recipe_ingredients
  for select to authenticated
  using (exists (select 1 from public.foods f where f.id = recipe_food_id));
create policy "recipe_ingredients: edit when recipe editable" on public.recipe_ingredients
  for all to authenticated
  using (public.can_edit_food(recipe_food_id)) with check (public.can_edit_food(recipe_food_id));

-- RLS: submissions ---------------------------------------------------------------

alter table public.food_submissions enable row level security;

create policy "food_submissions: submitter or admin reads" on public.food_submissions
  for select to authenticated
  using (submitted_by = (select auth.uid()) or public.is_admin());

create policy "food_submissions: submitter creates pending" on public.food_submissions
  for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "food_submissions: admin reviews" on public.food_submissions
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
