-- Foundations: extensions, enums, shared trigger functions, default privileges.
-- See docs/DATABASE.md. Every table in public has RLS enabled in the migration that creates it.

create extension if not exists pg_trgm with schema extensions;

-- The app requires sign-in. The anon role gets no access to app tables, now or in future migrations.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;

-- Enums ----------------------------------------------------------------------

create type public.app_role as enum ('admin');
create type public.sex as enum ('female', 'male');
create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type public.goal_type as enum ('lose', 'maintain', 'gain');
create type public.verification_status as enum ('verified', 'unverified', 'rejected');
create type public.serving_unit_kind as enum ('mass', 'volume', 'count');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.entry_method as enum ('manual', 'text', 'photo');
create type public.ai_input_type as enum ('text', 'photo');
create type public.ai_job_status as enum ('pending', 'completed', 'failed');
create type public.ai_candidate_outcome as enum ('pending', 'accepted', 'edited', 'removed');
create type public.assistant_role as enum ('user', 'assistant');
create type public.subscription_tier as enum ('free', 'premium');
create type public.entitlement_source as enum ('paystack', 'revenuecat', 'manual');
create type public.ai_feature as enum ('text_parse', 'photo_recognition', 'assistant');

-- Shared trigger: keep updated_at current ------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
