-- Food log: deterministic server-side snapshots and owner-only access.
-- The expected numbers mirror packages/core/src/nutrition.test.ts ("matches the database snapshot").
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

-- Fixtures (test values only — not real food data).
insert into public.serving_units (id, name, kind, grams_per_unit) values
  ('a0000000-0000-0000-0000-000000000001', 'test gram', 'mass', 1),
  ('a0000000-0000-0000-0000-000000000002', 'test wrap', 'count', null),
  ('a0000000-0000-0000-0000-000000000003', 'test derica', 'volume', null);
insert into public.foods (id, name, verification_status) values
  ('f0000000-0000-0000-0000-000000000001', 'Test swallow', 'unverified'),
  ('f0000000-0000-0000-0000-000000000002', 'Rounding food', 'unverified'),
  ('f0000000-0000-0000-0000-000000000003', 'Rejected food', 'rejected');
insert into public.food_nutrients (food_id, energy_kcal, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg) values
  ('f0000000-0000-0000-0000-000000000001', 150, 1.2, 35.5, 0.3, null, 0, null),
  ('f0000000-0000-0000-0000-000000000002', 0.67, null, null, null, null, null, null);
insert into public.food_servings (food_id, serving_unit_id, grams) values
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 220);

-- As user A ------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Client tries to supply its own nutrient values; they must be ignored.
insert into public.food_log_entries
  (id, log_date, meal_slot, food_id, serving_unit_id, quantity, food_name, grams, energy_kcal)
values
  ('e0000000-0000-0000-0000-000000000001', '2026-11-10', 'lunch',
   'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 1.5,
   'Fake', 1, 9999);

select results_eq(
  $$ select food_name, grams, energy_kcal, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg
       from public.food_log_entries where id = 'e0000000-0000-0000-0000-000000000001' $$,
  $$ values ('Test swallow'::text, 330.00::numeric, 495.00::numeric, 3.96::numeric, 117.15::numeric,
             0.99::numeric, null::numeric, 0.00::numeric, null::numeric) $$,
  'snapshot is computed from the catalogue (1.5 wraps × 220 g); client values are ignored; unknown stays null'
);

insert into public.food_log_entries (id, log_date, meal_slot, food_id, serving_unit_id, quantity)
values ('e0000000-0000-0000-0000-000000000002', '2026-11-10', 'snack',
        'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 150);

select is(
  (select energy_kcal from public.food_log_entries where id = 'e0000000-0000-0000-0000-000000000002'),
  1.01::numeric,
  '0.67 kcal/100 g × 150 g = 1.005 rounds half away from zero to 1.01 (same as core roundTo)'
);

-- Catalogue changes after logging (as postgres, simulating an admin correction).
reset role;
update public.food_nutrients set energy_kcal = 200 where food_id = 'f0000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

update public.food_log_entries set meal_slot = 'dinner', energy_kcal = 1
 where id = 'e0000000-0000-0000-0000-000000000001';

select is(
  (select energy_kcal from public.food_log_entries where id = 'e0000000-0000-0000-0000-000000000001'),
  495.00::numeric,
  'editing a non-portion field keeps the original snapshot and ignores client nutrient values'
);

update public.food_log_entries set quantity = 1 where id = 'e0000000-0000-0000-0000-000000000001';

select results_eq(
  $$ select grams, energy_kcal from public.food_log_entries where id = 'e0000000-0000-0000-0000-000000000001' $$,
  $$ values (220.00::numeric, 440.00::numeric) $$,
  'changing the portion recomputes the snapshot from current catalogue values'
);

select throws_ok(
  $$ insert into public.food_log_entries (log_date, meal_slot, food_id, serving_unit_id, quantity)
     values ('2026-11-10', 'lunch', 'f0000000-0000-0000-0000-000000000003',
             'a0000000-0000-0000-0000-000000000001', 100) $$,
  '23503',
  null,
  'users cannot log a rejected (hidden) food'
);

select throws_ok(
  $$ insert into public.food_log_entries (log_date, meal_slot, food_id, serving_unit_id, quantity)
     values ('2026-11-10', 'lunch', 'f0000000-0000-0000-0000-000000000001',
             'a0000000-0000-0000-0000-000000000003', 1) $$,
  '23514',
  null,
  'logging fails when the food has no gram weight for that serving unit'
);

select throws_ok(
  $$ insert into public.food_log_entries (log_date, meal_slot, food_id, serving_unit_id, quantity)
     values ('2026-11-10', 'lunch', 'f0000000-0000-0000-0000-000000000001',
             'a0000000-0000-0000-0000-000000000002', 0) $$,
  '23514',
  null,
  'quantity must be positive'
);

-- Offline sync replay: inserting the same client-generated id again is an idempotent upsert.
select lives_ok(
  $$ insert into public.food_log_entries (id, log_date, meal_slot, food_id, serving_unit_id, quantity)
     values ('e0000000-0000-0000-0000-000000000002', '2026-11-10', 'snack',
             'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 150)
     on conflict (id) do update set quantity = excluded.quantity $$,
  'replaying a synced entry with the same client id is an idempotent upsert'
);

-- As user B ------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is_empty($$ select 1 from public.food_log_entries $$, 'user B cannot see user A''s food log');

select throws_ok(
  $$ insert into public.food_log_entries (user_id, log_date, meal_slot, food_id, serving_unit_id, quantity)
     values ('11111111-1111-1111-1111-111111111111', '2026-11-10', 'lunch',
             'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 100) $$,
  '42501',
  null,
  'user B cannot write entries into user A''s log'
);

select results_eq(
  $$ with d as (delete from public.food_log_entries returning 1) select count(*)::int from d $$,
  array[0],
  'user B cannot delete user A''s entries'
);

-- Account deletion (ADR-021): user A has a custom food that their own log references.
reset role;
insert into public.foods (id, name, owner_user_id)
values ('f0000000-0000-0000-0000-0000000000a1', 'A custom', '11111111-1111-1111-1111-111111111111');
insert into public.food_nutrients (food_id, energy_kcal) values ('f0000000-0000-0000-0000-0000000000a1', 100);
insert into public.food_log_entries (user_id, log_date, meal_slot, food_id, serving_unit_id, quantity)
values ('11111111-1111-1111-1111-111111111111', '2026-11-10', 'lunch',
        'f0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 100);

select lives_ok(
  $$ delete from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'deleting an account succeeds even when the log references the user''s custom foods'
);

select is(
  (select count(*)::int from public.food_log_entries where user_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.foods where owner_user_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'account deletion removes the user''s profile, log entries and custom foods'
);

select * from finish();
rollback;
