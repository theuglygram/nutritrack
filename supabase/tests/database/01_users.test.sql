-- Profiles, roles and goals: users only ever see and change their own rows.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('33333333-3333-3333-3333-333333333333', 'admin');

-- As user A ------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'user sees only their own profile'
);

select results_eq(
  $$ with u as (update public.profiles set display_name = 'Ada' returning 1) select count(*)::int from u $$,
  array[1],
  'user can update their own profile'
);

select results_eq(
  $$ with u as (update public.profiles set display_name = 'Hacked'
                 where id = '22222222-2222-2222-2222-222222222222' returning 1)
     select count(*)::int from u $$,
  array[0],
  'user cannot update another user''s profile'
);

select is(public.is_admin(), false, 'regular user is not admin');

select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('11111111-1111-1111-1111-111111111111', 'admin') $$,
  '42501',
  null,
  'user cannot grant themselves the admin role'
);

select results_eq(
  $$ select user_id from public.user_roles $$,
  $$ select null::uuid where false $$,
  'regular user cannot see other users'' roles'
);

select lives_ok(
  $$ insert into public.user_goals (goal_type, calorie_target, protein_g, carbs_g, fat_g, water_ml)
     values ('lose', 1800, 120, 180, 60, 2500) $$,
  'user can add a goal for themselves (user_id defaults to auth.uid())'
);

select throws_ok(
  $$ insert into public.user_goals (user_id, goal_type, calorie_target, protein_g, carbs_g, fat_g, water_ml)
     values ('22222222-2222-2222-2222-222222222222', 'gain', 3000, 150, 400, 80, 2500) $$,
  '42501',
  null,
  'user cannot add a goal for another user'
);

select results_eq(
  $$ with u as (update public.user_goals set calorie_target = 900 returning 1) select count(*)::int from u $$,
  array[0],
  'goals are history: users cannot rewrite past goals'
);

select throws_ok(
  $$ insert into public.user_goals (goal_type, calorie_target, protein_g, carbs_g, fat_g, water_ml)
     values ('lose', 100, 0, 0, 0, 0) $$,
  '23514',
  null,
  'implausible calorie targets are rejected by the database'
);

-- As user B ------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is_empty($$ select 1 from public.user_goals $$, 'user B cannot see user A''s goals');

-- As admin -------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(public.is_admin(), true, 'admin is recognised by is_admin()');

select is_empty(
  $$ select 1 from public.profiles where id <> '33333333-3333-3333-3333-333333333333' $$,
  'even admins cannot read other users'' profiles'
);

reset role;
select * from finish();
rollback;
