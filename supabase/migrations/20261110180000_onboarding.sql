-- Stage 03: onboarding rules enforced by the database (ADR-031).
-- Numbers mirror packages/core/src/targets.ts; both test suites assert them.

alter table public.profiles
  add column strength_trains boolean;

comment on column public.profiles.strength_trains is
  'Regular strength training: raises the protein target to 1.6 g/kg (ADR-031).';

-- 18+ only. A CHECK constraint can't use current_date, so a trigger enforces it.
create function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth is not null
     and new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'NutriTrack is for adults aged 18 and over'
      using errcode = '23514', hint = 'underage';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_adult
  before insert or update of date_of_birth on public.profiles
  for each row execute function public.enforce_adult_profile();

-- Calorie floors apply to every goal, including user overrides (ADR-024, ADR-031).
-- If sex is unknown, the higher floor applies.
create function public.enforce_calorie_floor()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sex public.sex;
  v_floor integer;
begin
  select p.sex into v_sex from public.profiles p where p.id = new.user_id;
  v_floor := case when v_sex = 'female' then 1200 else 1500 end;
  if new.calorie_target < v_floor then
    raise exception 'Daily calorie target % is below the safe minimum of % kcal',
      new.calorie_target, v_floor
      using errcode = '23514', hint = 'calorie_floor';
  end if;
  return new;
end;
$$;

create trigger user_goals_enforce_calorie_floor
  before insert on public.user_goals
  for each row execute function public.enforce_calorie_floor();

-- Onboarding in one transaction: profile, consent, first weigh-in and first goal.
-- Security invoker: every write is still checked by RLS and the triggers above.
create function public.complete_onboarding(
  p_display_name text,
  p_sex public.sex,
  p_date_of_birth date,
  p_height_cm numeric,
  p_activity_level public.activity_level,
  p_strength_trains boolean,
  p_weight_kg numeric,
  p_measured_on date,
  p_goal_type public.goal_type,
  p_target_rate_kg_per_week numeric,
  p_calorie_target integer,
  p_protein_g integer,
  p_carbs_g integer,
  p_fat_g integer,
  p_water_ml integer,
  p_consent_version text,
  -- Last, with a default: not applicable to "maintain" goals.
  p_target_weight_kg numeric default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_consent_version is null or char_length(p_consent_version) = 0 then
    raise exception 'Consent to process health data is required'
      using errcode = '23514', hint = 'consent_required';
  end if;

  update public.profiles
     set display_name = p_display_name,
         sex = p_sex,
         date_of_birth = p_date_of_birth,
         height_cm = p_height_cm,
         activity_level = p_activity_level,
         strength_trains = p_strength_trains,
         health_data_consent_at = now(),
         consent_version = p_consent_version,
         onboarding_completed_at = now()
   where id = v_uid;

  insert into public.weight_entries (user_id, measured_on, weight_kg)
  values (v_uid, p_measured_on, p_weight_kg)
  on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;

  insert into public.user_goals (
    user_id, goal_type, target_weight_kg, target_rate_kg_per_week,
    calorie_target, protein_g, carbs_g, fat_g, water_ml, is_override, effective_from
  )
  values (
    v_uid, p_goal_type, p_target_weight_kg, p_target_rate_kg_per_week,
    p_calorie_target, p_protein_g, p_carbs_g, p_fat_g, p_water_ml, false, p_measured_on
  );
end;
$$;

revoke execute on function public.complete_onboarding(
  text, public.sex, date, numeric, public.activity_level, boolean, numeric, date,
  public.goal_type, numeric, integer, integer, integer, integer, integer, text, numeric
) from public, anon;
grant execute on function public.complete_onboarding(
  text, public.sex, date, numeric, public.activity_level, boolean, numeric, date,
  public.goal_type, numeric, integer, integer, integer, integer, integer, text, numeric
) to authenticated;
