-- Stage 03 onboarding rules: adults only, calorie floors (also on overrides), atomic onboarding.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ update public.profiles set date_of_birth = (current_date - interval '17 years')::date $$,
  '23514',
  'NutriTrack is for adults aged 18 and over',
  'under-18 dates of birth are rejected'
);

select lives_ok(
  $$ update public.profiles set date_of_birth = (current_date - interval '18 years')::date $$,
  'exactly 18 today is accepted'
);

select throws_ok(
  $$ select public.complete_onboarding('Ada', 'female', '1990-05-01', 165, 'moderate', true, 70, '2026-11-10',
       'lose', 0.5, 1800, 112, 205, 50, 2500, null, 62) $$,
  '23514',
  'Consent to process health data is required',
  'onboarding requires consent'
);

select throws_ok(
  $$ select public.complete_onboarding('Ada', 'female', '1990-05-01', 165, 'moderate', true, 70, '2026-11-10',
       'lose', 0.5, 1100, 112, 205, 50, 2500, 'v1', 62) $$,
  '23514',
  'Daily calorie target 1100 is below the safe minimum of 1200 kcal',
  'onboarding cannot set a target below the female floor'
);

select is_empty(
  $$ select 1 from public.user_goals union all
     select 1 from public.weight_entries union all
     select 1 from public.profiles where onboarding_completed_at is not null $$,
  'a failed onboarding leaves nothing half-saved (single transaction)'
);

select lives_ok(
  $$ select public.complete_onboarding('Ada', 'female', '1990-05-01', 165, 'moderate', true, 70, '2026-11-10',
       'lose', 0.5, 1800, 112, 205, 50, 2500, 'v1', 62) $$,
  'valid onboarding succeeds'
);

select results_eq(
  $$ select p.strength_trains, p.consent_version, p.onboarding_completed_at is not null,
            (select weight_kg from public.weight_entries),
            (select calorie_target from public.user_goals)
       from public.profiles p $$,
  $$ values (true, 'v1'::text, true, 70.00::numeric, 1800) $$,
  'onboarding saves profile, consent, first weigh-in and first goal together'
);

select throws_ok(
  $$ insert into public.user_goals (goal_type, calorie_target, protein_g, carbs_g, fat_g, water_ml, is_override)
     values ('lose', 1150, 100, 100, 40, 2500, true) $$,
  '23514',
  null,
  'user overrides cannot go below the calorie floor either'
);

-- User B has no sex recorded yet: the higher (1,500 kcal) floor applies.
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  $$ insert into public.user_goals (goal_type, calorie_target, protein_g, carbs_g, fat_g, water_ml)
     values ('maintain', 1400, 100, 150, 45, 2500) $$,
  '23514',
  'Daily calorie target 1400 is below the safe minimum of 1500 kcal',
  'when sex is unknown, the higher floor applies'
);

reset role;
select * from finish();
rollback;
