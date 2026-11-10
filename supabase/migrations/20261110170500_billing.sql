-- Billing (ADR-019). Written only by server webhooks / Edge Functions with the service role.
-- A user with no entitlements row is on the free tier.

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  source public.entitlement_source,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tier = 'free' or source is not null)
);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  feature public.ai_feature not null,
  period_start date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, feature, period_start)
);

alter table public.entitlements enable row level security;
alter table public.ai_usage enable row level security;

create policy "entitlements: owner reads" on public.entitlements
  for select to authenticated using (user_id = (select auth.uid()));

create policy "ai_usage: owner reads" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
