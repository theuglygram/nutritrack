-- Stage 04: the seeded catalogue, search by English and local names, and private custom foods.
-- Runs against supabase/seed.sql (applied by `supabase db reset` / `supabase start`).
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

-- Seeded catalogue rules (exit criteria for Stage 04) ------------------------------
select ok(
  (select count(*) from public.foods where owner_user_id is null) >= 50,
  'the global catalogue is seeded'
);
select is(
  (select count(*) from public.foods where owner_user_id is null and data_source_id is null),
  0::bigint,
  'every seeded food has a data source'
);
select is(
  (select count(*) from public.foods where owner_user_id is null and verification_status = 'verified'),
  0::bigint,
  'nothing is marked verified before dietitian review (ADR-013)'
);
select is(
  (select count(*) from public.foods f where owner_user_id is null
     and not exists (select 1 from public.food_nutrients n where n.food_id = f.id and n.energy_kcal is not null)),
  0::bigint,
  'every seeded food has an energy value'
);
select results_eq(
  $$ select n.energy_kcal, n.protein_g, n.carbs_g, n.fat_g
     from public.foods f join public.food_nutrients n on n.food_id = f.id
     where f.name = 'Rice, white, boiled' $$,
  $$ values (130.00::numeric, 2.69::numeric, 28.17::numeric, 0.28::numeric) $$,
  'seeded values land in the right columns (USDA 168878 per 100 g)'
);
select is(
  (select count(*) from public.food_servings s join public.foods f on f.id = s.food_id
     where f.owner_user_id is null and (s.is_estimate or s.data_source_id is null)),
  0::bigint,
  'seeded servings are sourced measurements, not estimates'
);
select is(
  (select count(*) from public.serving_units
     where lower(name) in ('wrap', 'derica', 'mudu', 'ladle', 'cooking spoon') and grams_per_unit is null),
  5::bigint,
  'Nigerian portion units exist and have no universal gram weight (set per food when measured)'
);

-- Search (as a signed-in user) --------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Test list: local and English names → expected top result.
select is((select name from public.search_foods('ewa') limit 1), 'Beans (cowpeas), boiled', 'Yoruba "ewa" finds beans');
select is((select name from public.search_foods('dodo') limit 1), 'Plantain, ripe, fried', '"dodo" finds fried ripe plantain');
select is((select name from public.search_foods('isu') limit 1), 'Yam, boiled', 'Yoruba "isu" finds yam');
select is((select name from public.search_foods('shinkafa') limit 1), 'Rice, white, boiled', 'Hausa "shinkafa" finds rice');
select is((select name from public.search_foods('okro') limit 1), 'Okra, boiled', 'Pidgin "okro" finds okra');
select is((select name from public.search_foods('groundnut') limit 1), 'Groundnuts (peanuts), raw', '"groundnut" finds groundnuts');
select is((select name from public.search_foods('plantian') limit 1) like 'Plantain%', true, 'a misspelling still finds plantain');
select is(
  (select matched_language from public.search_foods('ewa') limit 1),
  'yo',
  'results say which local name matched'
);
select is((select count(*) from public.search_foods('a')), 0::bigint, 'one-letter queries return nothing');

-- Custom foods ------------------------------------------------------------------------
select lives_ok(
  $$ select public.create_custom_food('Mama Put special', 'Meals', 180, 6, 22, 7, null, null, null, 'plate', 450) $$,
  'a user can create a custom food with a serving'
);
select results_eq(
  $$ select is_custom, verification_status::text from public.search_foods('mama put') $$,
  $$ values (true, 'unverified') $$,
  'the owner finds their custom food, labelled unverified'
);
select throws_ok(
  $$ select public.create_custom_food('Impossible', null, 1200, 0, 0, 0) $$,
  '23514',
  null,
  'implausible nutrient values are rejected by the database'
);

set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  (select count(*) from public.search_foods('mama put')),
  0::bigint,
  'another user cannot find someone else''s custom food'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.search_foods('rice') $$,
  '42501',
  null,
  'signed-out visitors cannot search'
);
select throws_ok(
  $$ select public.create_custom_food('x', null, 1, 1, 1, 1) $$,
  '42501',
  null,
  'signed-out visitors cannot create foods'
);

reset role;
select * from finish();
rollback;
