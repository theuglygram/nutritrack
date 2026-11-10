-- AI: recognition jobs, candidates, assistant conversations.
-- Written only by Edge Functions using the service role (no write policies for users yet).
-- Release 2 (Stages 11–12) may add narrowly scoped user write policies, e.g. for confirmations.

create table public.ai_recognition_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_type public.ai_input_type not null,
  input_text text check (char_length(input_text) <= 2000),
  photo_path text,
  model text,
  status public.ai_job_status not null default 'pending',
  raw_output jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, user_id),
  check (
    (input_type = 'text' and input_text is not null)
    or (input_type = 'photo' and photo_path is not null)
  )
);

create index ai_recognition_jobs_user_idx on public.ai_recognition_jobs (user_id, created_at desc);

create table public.ai_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  user_id uuid not null,
  label text not null check (char_length(label) between 1 and 200),
  matched_food_id uuid references public.foods (id) on delete set null,
  suggested_quantity numeric(8, 2) check (suggested_quantity > 0),
  suggested_unit_id uuid references public.serving_units (id) on delete set null,
  confidence numeric(4, 3) check (confidence between 0 and 1),
  final_food_id uuid references public.foods (id) on delete set null,
  final_quantity numeric(8, 2) check (final_quantity > 0),
  final_unit_id uuid references public.serving_units (id) on delete set null,
  outcome public.ai_candidate_outcome not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Candidate always belongs to the same user as its job.
  foreign key (job_id, user_id) references public.ai_recognition_jobs (id, user_id) on delete cascade
);

create index ai_candidates_job_idx on public.ai_candidates (job_id);

create trigger ai_candidates_set_updated_at
  before update on public.ai_candidates
  for each row execute function public.set_updated_at();

alter table public.food_log_entries
  add constraint food_log_entries_ai_candidate_fkey
  foreign key (ai_candidate_id) references public.ai_candidates (id) on delete set null;

create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text check (char_length(title) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index assistant_conversations_user_idx
  on public.assistant_conversations (user_id, updated_at desc);

create trigger assistant_conversations_set_updated_at
  before update on public.assistant_conversations
  for each row execute function public.set_updated_at();

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null,
  role public.assistant_role not null,
  content text not null check (char_length(content) <= 20000),
  model text,
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id)
    references public.assistant_conversations (id, user_id) on delete cascade
);

create index assistant_messages_conversation_idx
  on public.assistant_messages (conversation_id, created_at);

-- RLS ----------------------------------------------------------------------------

alter table public.ai_recognition_jobs enable row level security;
alter table public.ai_candidates enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

create policy "ai_recognition_jobs: owner reads" on public.ai_recognition_jobs
  for select to authenticated using (user_id = (select auth.uid()));

create policy "ai_candidates: owner reads" on public.ai_candidates
  for select to authenticated using (user_id = (select auth.uid()));

create policy "assistant_conversations: owner reads" on public.assistant_conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "assistant_conversations: owner deletes" on public.assistant_conversations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "assistant_messages: owner reads" on public.assistant_messages
  for select to authenticated using (user_id = (select auth.uid()));
