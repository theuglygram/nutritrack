-- Stage 04: reference units and cooking methods, fuzzy food search, custom foods.

-- Reference data ----------------------------------------------------------------
-- Only universal units carry a gram weight. Everything else (including Nigerian portions such as
-- a wrap or a derica) is converted per food in food_servings, from measured or sourced weights.
insert into public.serving_units (name, kind, grams_per_unit) values
  ('gram', 'mass', 1),
  ('kilogram', 'mass', 1000),
  ('cup', 'volume', null),
  ('tablespoon', 'volume', null),
  ('teaspoon', 'volume', null),
  ('cooking spoon', 'volume', null),
  ('ladle', 'volume', null),
  ('derica', 'volume', null),
  ('mudu', 'volume', null),
  ('wrap', 'count', null),
  ('plate', 'count', null),
  ('piece', 'count', null),
  ('slice', 'count', null),
  ('fillet', 'count', null),
  ('small', 'count', null),
  ('medium', 'count', null),
  ('large', 'count', null),
  ('serving', 'count', null)
on conflict do nothing;

insert into public.cooking_methods (name) values
  ('Raw'), ('Boiled'), ('Fried'), ('Grilled'), ('Roasted'), ('Stewed'), ('Baked'), ('Steamed')
on conflict do nothing;

-- Search ------------------------------------------------------------------------
-- Fuzzy search over food names and local-language aliases (trigram word similarity), returning
-- each food once with its best match. Security invoker: foods RLS decides what each user sees
-- (global non-rejected foods plus their own custom foods).
create function public.search_foods(p_query text, p_limit integer default 20)
returns table (
  id uuid,
  name text,
  category text,
  verification_status public.verification_status,
  is_custom boolean,
  source_name text,
  energy_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  matched_alias text,
  matched_language text,
  score real
)
language sql
stable
set search_path = ''
as $$
  with q as (
    select lower(btrim(p_query)) as term
    where char_length(btrim(coalesce(p_query, ''))) between 2 and 60
  ),
  candidates as (
    select
      f.id,
      null::text as alias,
      null::text as language,
      greatest(
        extensions.word_similarity(q.term, lower(f.name)),
        case
          when lower(f.name) like q.term || '%' then 1
          when lower(f.name) like '%' || q.term || '%' then 0.8
          else 0
        end
      ) as score
    from public.foods f
    cross join q
    union all
    select
      a.food_id,
      a.alias,
      a.language,
      greatest(
        extensions.word_similarity(q.term, lower(a.alias)),
        case
          when lower(a.alias) = q.term then 1
          when lower(a.alias) like q.term || '%' then 0.95
          else 0
        end
      )
    from public.food_aliases a
    cross join q
  ),
  best as (
    select distinct on (c.id) c.id, c.alias, c.language, c.score
    from candidates c
    where c.score >= 0.4
    order by c.id, c.score desc, c.alias nulls first
  )
  select
    f.id,
    f.name,
    f.category,
    f.verification_status,
    f.owner_user_id is not null,
    s.name,
    n.energy_kcal,
    n.protein_g,
    n.carbs_g,
    n.fat_g,
    b.alias,
    b.language,
    b.score::real
  from best b
  join public.foods f on f.id = b.id
  left join public.food_nutrients n on n.food_id = f.id
  left join public.data_sources s on s.id = f.data_source_id
  order by b.score desc, f.owner_user_id is not null desc, char_length(f.name), f.name
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke execute on function public.search_foods(text, integer) from public, anon;
grant execute on function public.search_foods(text, integer) to authenticated, service_role;

-- Custom foods --------------------------------------------------------------------
-- Creates a user's private food with its nutrients (and optionally one serving) in one
-- transaction. Custom foods are always unverified (enforced by a check constraint) and visible
-- only to their owner (foods RLS). Values are validated by Zod in the client library and by the
-- table constraints here.
create function public.create_custom_food(
  p_name text,
  p_category text,
  p_energy_kcal numeric,
  p_protein_g numeric,
  p_carbs_g numeric,
  p_fat_g numeric,
  p_fibre_g numeric default null,
  p_sugar_g numeric default null,
  p_sodium_mg numeric default null,
  p_serving_unit text default null,
  p_serving_grams numeric default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_unit uuid;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into public.foods (name, category, owner_user_id, verification_status, notes)
  values (btrim(p_name), nullif(btrim(p_category), ''), v_uid, 'unverified', 'Added by you')
  returning id into v_id;

  insert into public.food_nutrients
    (food_id, energy_kcal, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg)
  values
    (v_id, p_energy_kcal, p_protein_g, p_carbs_g, p_fat_g, p_fibre_g, p_sugar_g, p_sodium_mg);

  if p_serving_grams is not null then
    select su.id into v_unit
    from public.serving_units su
    where lower(su.name) = lower(coalesce(p_serving_unit, 'serving'));
    if v_unit is null then
      raise exception 'unknown serving unit' using errcode = '23514';
    end if;
    insert into public.food_servings (food_id, serving_unit_id, grams, is_estimate, notes)
    values (v_id, v_unit, p_serving_grams, true, 'Entered by you');
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_custom_food(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric
) from public, anon;
grant execute on function public.create_custom_food(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric
) to authenticated;
