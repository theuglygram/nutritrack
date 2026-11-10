-- Audit log for changes to the global food catalogue.
-- Users' private custom foods are not audited (privacy); only global catalogue data is.

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_table_created_idx on public.audit_log (table_name, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log: admin reads" on public.audit_log
  for select to authenticated using (public.is_admin());

-- Security definer so the trigger can write audit rows that users cannot write directly.
create function public.audit_catalogue_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_parent_food uuid;
  v_owner uuid;
begin
  if tg_table_name = 'foods' then
    v_owner := (v_row ->> 'owner_user_id')::uuid;
  else
    v_parent_food := coalesce(v_row ->> 'food_id', v_row ->> 'recipe_food_id')::uuid;
    if v_parent_food is not null then
      select f.owner_user_id into v_owner from public.foods f where f.id = v_parent_food;
      -- Parent already gone: this is a cascade from a food delete, which is audited itself.
      if not found then
        return null;
      end if;
    end if;
  end if;

  if v_owner is not null then
    return null; -- private custom food
  end if;

  insert into public.audit_log (actor_id, action, table_name, record_id, before, after)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'food_id'),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end;
$$;

revoke execute on function public.audit_catalogue_change() from public, anon, authenticated;

create trigger data_sources_audit after insert or update or delete on public.data_sources
  for each row execute function public.audit_catalogue_change();
create trigger cooking_methods_audit after insert or update or delete on public.cooking_methods
  for each row execute function public.audit_catalogue_change();
create trigger serving_units_audit after insert or update or delete on public.serving_units
  for each row execute function public.audit_catalogue_change();
create trigger foods_audit after insert or update or delete on public.foods
  for each row execute function public.audit_catalogue_change();
create trigger food_aliases_audit after insert or update or delete on public.food_aliases
  for each row execute function public.audit_catalogue_change();
create trigger food_nutrients_audit after insert or update or delete on public.food_nutrients
  for each row execute function public.audit_catalogue_change();
create trigger food_servings_audit after insert or update or delete on public.food_servings
  for each row execute function public.audit_catalogue_change();
create trigger recipe_ingredients_audit after insert or update or delete on public.recipe_ingredients
  for each row execute function public.audit_catalogue_change();
