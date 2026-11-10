-- Baseline security guarantees that must hold for every table, including future ones.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select tables_are(
  'public',
  array[
    'profiles', 'user_roles', 'user_goals',
    'data_sources', 'cooking_methods', 'serving_units',
    'foods', 'food_aliases', 'food_nutrients', 'food_servings', 'recipe_ingredients',
    'food_submissions',
    'food_log_entries', 'weight_entries', 'water_entries',
    'ai_recognition_jobs', 'ai_candidates', 'assistant_conversations', 'assistant_messages',
    'entitlements', 'ai_usage',
    'audit_log'
  ],
  'public schema contains exactly the documented tables'
);

select is_empty(
  $$ select c.relname
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'every public table has row level security enabled'
);

select is_empty(
  $$ select table_name, privilege_type
       from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public' $$,
  'anon role has no privileges on any public table'
);

select ok(
  not has_function_privilege('anon', 'public.is_admin()', 'execute'),
  'anon cannot call is_admin()'
);

select ok(
  not has_function_privilege('authenticated', 'public.audit_catalogue_change()', 'execute'),
  'users cannot call the audit trigger function directly'
);

-- Sign-up creates a profile.
insert into auth.users (id, email, instance_id, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.local',
        '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'a profile row is created on sign-up'
);

select is(
  (select photo_evaluation_opt_in from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  false,
  'photo evaluation is opt-in (defaults to false, ADR-021)'
);

select * from finish();
rollback;
