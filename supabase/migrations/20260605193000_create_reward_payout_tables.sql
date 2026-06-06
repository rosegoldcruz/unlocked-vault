create extension if not exists pgcrypto;

create table if not exists public.iv_module_completions (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null,
  module_number integer not null,
  source text not null default 'academy',
  source_event_id text null,
  completed_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (privy_user_id, module_number),
  check (module_number between 1 and 6)
);

create table if not exists public.iv_reward_milestones (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null,
  milestone_number integer not null,
  module_start integer not null,
  module_end integer not null,
  status text not null default 'locked',
  eligible_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (privy_user_id, milestone_number),
  check (milestone_number between 1 and 3),
  check (module_start between 1 and 6),
  check (module_end between 1 and 6),
  check (module_start <= module_end),
  check (status in ('locked','eligible','queued','paid','failed','canceled'))
);

create table if not exists public.iv_payout_jobs (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null,
  milestone_number integer not null,
  wallet_address text not null,
  token_mint text not null,
  amount_raw text not null,
  status text not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz null,
  last_error text null,
  locked_at timestamptz null,
  locked_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (privy_user_id, milestone_number),
  check (milestone_number between 1 and 3),
  check (status in ('queued','processing','paid','failed','canceled')),
  check (attempts >= 0),
  check (max_attempts > 0)
);

create table if not exists public.iv_payout_transactions (
  id uuid primary key default gen_random_uuid(),
  payout_job_id uuid not null references public.iv_payout_jobs(id) on delete restrict,
  privy_user_id text not null,
  milestone_number integer not null,
  wallet_address text not null,
  token_mint text not null,
  amount_raw text not null,
  signature text not null,
  status text not null default 'confirmed',
  confirmed_at timestamptz null,
  raw_response jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payout_job_id),
  unique (signature),
  check (milestone_number between 1 and 3),
  check (status in ('submitted','confirmed','failed'))
);

create index if not exists idx_iv_module_completions_privy_user_id
  on public.iv_module_completions (privy_user_id);
create index if not exists idx_iv_module_completions_module_number
  on public.iv_module_completions (module_number);
create index if not exists idx_iv_reward_milestones_privy_user_id
  on public.iv_reward_milestones (privy_user_id);
create index if not exists idx_iv_reward_milestones_status
  on public.iv_reward_milestones (status);
create index if not exists idx_iv_reward_milestones_milestone_number
  on public.iv_reward_milestones (milestone_number);
create index if not exists idx_iv_payout_jobs_privy_user_id
  on public.iv_payout_jobs (privy_user_id);
create index if not exists idx_iv_payout_jobs_status
  on public.iv_payout_jobs (status);
create index if not exists idx_iv_payout_jobs_milestone_number
  on public.iv_payout_jobs (milestone_number);
create index if not exists idx_iv_payout_jobs_wallet_address
  on public.iv_payout_jobs (wallet_address);
create index if not exists idx_iv_payout_jobs_next_attempt_at
  on public.iv_payout_jobs (next_attempt_at);
create index if not exists idx_iv_payout_transactions_privy_user_id
  on public.iv_payout_transactions (privy_user_id);
create index if not exists idx_iv_payout_transactions_milestone_number
  on public.iv_payout_transactions (milestone_number);
create index if not exists idx_iv_payout_transactions_wallet_address
  on public.iv_payout_transactions (wallet_address);
create index if not exists idx_iv_payout_transactions_signature
  on public.iv_payout_transactions (signature);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_iv_module_completions_updated_at on public.iv_module_completions;
create trigger set_iv_module_completions_updated_at
before update on public.iv_module_completions
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_reward_milestones_updated_at on public.iv_reward_milestones;
create trigger set_iv_reward_milestones_updated_at
before update on public.iv_reward_milestones
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_payout_jobs_updated_at on public.iv_payout_jobs;
create trigger set_iv_payout_jobs_updated_at
before update on public.iv_payout_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_payout_transactions_updated_at on public.iv_payout_transactions;
create trigger set_iv_payout_transactions_updated_at
before update on public.iv_payout_transactions
for each row execute function public.set_updated_at();

alter table public.iv_module_completions enable row level security;
alter table public.iv_reward_milestones enable row level security;
alter table public.iv_payout_jobs enable row level security;
alter table public.iv_payout_transactions enable row level security;
