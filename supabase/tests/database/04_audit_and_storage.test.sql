-- Audit log of catalogue changes, and private meal-photo storage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, instance_id, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('33333333-3333-3333-3333-333333333333', 'admin');

-- Audit ----------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into public.foods (id, name) values ('f0000000-0000-0000-0000-000000000001', 'Global food');
update public.foods set name = 'Global food (edited)' where id = 'f0000000-0000-0000-0000-000000000001';

select results_eq(
  $$ select action, actor_id, after ->> 'name'
       from public.audit_log
      where table_name = 'foods' and record_id = 'f0000000-0000-0000-0000-000000000001'
      order by id $$,
  $$ values ('INSERT'::text, '33333333-3333-3333-3333-333333333333'::uuid, 'Global food'::text),
            ('UPDATE'::text, '33333333-3333-3333-3333-333333333333'::uuid, 'Global food (edited)'::text) $$,
  'admin changes to global foods are audited with the actor and new values'
);

set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.foods (id, name, owner_user_id)
values ('f0000000-0000-0000-0000-0000000000a1', 'Private food', '11111111-1111-1111-1111-111111111111');
insert into public.food_nutrients (food_id, energy_kcal) values ('f0000000-0000-0000-0000-0000000000a1', 50);

select is_empty(
  $$ select 1 from public.audit_log $$,
  'regular users cannot read the audit log'
);

reset role;
select is_empty(
  $$ select 1 from public.audit_log
      where record_id = 'f0000000-0000-0000-0000-0000000000a1' $$,
  'private custom foods (and their nutrients) are not written to the audit log'
);

select throws_ok(
  $$ set local role authenticated;
     insert into public.audit_log (action, table_name) values ('INSERT', 'foods') $$,
  '42501',
  null,
  'users cannot write audit entries directly'
);
reset role;

-- Storage --------------------------------------------------------------------
select results_eq(
  $$ select public, file_size_limit from storage.buckets where id = 'meal-photos' $$,
  $$ values (false, 5242880::bigint) $$,
  'meal-photos bucket exists, is private and capped at 5 MiB'
);

insert into storage.objects (bucket_id, name) values
  ('meal-photos', '11111111-1111-1111-1111-111111111111/a.jpg'),
  ('meal-photos', '22222222-2222-2222-2222-222222222222/b.jpg');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select name from storage.objects where bucket_id = 'meal-photos' $$,
  $$ values ('11111111-1111-1111-1111-111111111111/a.jpg'::text) $$,
  'users can only see photos in their own folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('meal-photos', '22222222-2222-2222-2222-222222222222/evil.jpg') $$,
  '42501',
  null,
  'users cannot upload into another user''s folder'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('meal-photos', '11111111-1111-1111-1111-111111111111/c.jpg') $$,
  'users can upload into their own folder'
);

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'meal-photos' $$,
  'signed-out visitors cannot see any meal photos'
);

reset role;
select * from finish();
rollback;
