-- Food catalogue: admins manage global foods, users manage only their private custom foods.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('33333333-3333-3333-3333-333333333333', 'admin');

-- Fixtures (test values only — not real food data).
insert into public.data_sources (id, name) values
  ('d0000000-0000-0000-0000-000000000001', 'Test source');
insert into public.foods (id, name, verification_status, data_source_id) values
  ('f0000000-0000-0000-0000-000000000001', 'Verified global', 'verified', 'd0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'Rejected global', 'rejected', null),
  ('f0000000-0000-0000-0000-000000000003', 'Unverified global', 'unverified', null);

select throws_ok(
  $$ insert into public.foods (name, verification_status) values ('No source', 'verified') $$,
  '23514',
  null,
  'a food cannot be verified without a data source'
);

-- As user A ------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select name from public.foods order by name $$,
  $$ values ('Unverified global'), ('Verified global') $$,
  'users see verified and unverified global foods, not rejected ones'
);

select throws_ok(
  $$ insert into public.foods (name) values ('Sneaky global') $$,
  '42501',
  null,
  'users cannot create global foods'
);

select results_eq(
  $$ with u as (update public.foods set name = 'Renamed'
                 where id = 'f0000000-0000-0000-0000-000000000001' returning 1)
     select count(*)::int from u $$,
  array[0],
  'users cannot edit global foods'
);

select lives_ok(
  $$ insert into public.foods (id, name, owner_user_id)
     values ('f0000000-0000-0000-0000-0000000000a1', 'My jollof', '11111111-1111-1111-1111-111111111111') $$,
  'users can create a private custom food'
);

select throws_ok(
  $$ insert into public.foods (name, owner_user_id, verification_status, data_source_id)
     values ('Fake verified', '11111111-1111-1111-1111-111111111111', 'verified',
             'd0000000-0000-0000-0000-000000000001') $$,
  '23514',
  null,
  'custom foods can never be marked verified'
);

select lives_ok(
  $$ insert into public.food_nutrients (food_id, energy_kcal)
     values ('f0000000-0000-0000-0000-0000000000a1', 120) $$,
  'users can add nutrients to their own custom food'
);

select throws_ok(
  $$ insert into public.food_nutrients (food_id, energy_kcal)
     values ('f0000000-0000-0000-0000-000000000001', 1) $$,
  '42501',
  null,
  'users cannot add nutrients to a global food'
);

select throws_ok(
  $$ insert into public.food_nutrients (food_id, protein_g)
     values ('f0000000-0000-0000-0000-0000000000a1', 150) $$,
  '23514',
  null,
  'implausible per-100 g values (protein > 100 g) are rejected'
);

select lives_ok(
  $$ insert into public.food_submissions (payload) values ('{"name": "Ofada stew"}') $$,
  'users can submit a food for review'
);

select throws_ok(
  $$ insert into public.food_submissions (payload, status) values ('{"name": "x"}', 'approved') $$,
  '42501',
  null,
  'users cannot self-approve a submission'
);

select results_eq(
  $$ with u as (update public.food_submissions set status = 'approved' returning 1) select count(*)::int from u $$,
  array[0],
  'users cannot review submissions'
);

-- As user B ------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.foods where id = 'f0000000-0000-0000-0000-0000000000a1' $$,
  'custom foods are private to their owner'
);

select is_empty(
  $$ select 1 from public.food_nutrients where food_id = 'f0000000-0000-0000-0000-0000000000a1' $$,
  'nutrients of another user''s custom food are hidden too'
);

-- As admin -------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(
  (select count(*)::int from public.foods where id = 'f0000000-0000-0000-0000-000000000002'),
  1,
  'admins can see rejected foods'
);

select lives_ok(
  $$ insert into public.foods (name, verification_status, data_source_id)
     values ('Admin food', 'verified', 'd0000000-0000-0000-0000-000000000001') $$,
  'admins can create verified global foods'
);

select results_eq(
  $$ with u as (update public.food_submissions set status = 'approved',
                  reviewed_by = '33333333-3333-3333-3333-333333333333', reviewed_at = now()
                returning 1)
     select count(*)::int from u $$,
  array[1],
  'admins can review submissions'
);

reset role;
select * from finish();
rollback;
