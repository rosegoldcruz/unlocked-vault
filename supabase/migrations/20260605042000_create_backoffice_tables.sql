create extension if not exists pgcrypto;

create table if not exists public.iv_user_profiles (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  email text,
  role text not null default 'MEMBER' check (role in ('MEMBER', 'VIP', 'ADMIN')),
  current_tier text,
  referral_code text not null unique,
  referred_by_privy_user_id text references public.iv_user_profiles(privy_user_id) on delete set null,
  vault_xp integer not null default 0,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.iv_user_positions (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique references public.iv_user_profiles(privy_user_id) on delete cascade,
  investment_total numeric not null default 0,
  advance_amount numeric not null default 0,
  royalty_spent numeric not null default 0,
  token_balance numeric not null default 0,
  dividends_total numeric not null default 0,
  royalty_2_percent_status text not null default 'NO' check (royalty_2_percent_status in ('YES', 'NO', 'DISCONTINUED')),
  royalty_1_percent_status text not null default 'NO' check (royalty_1_percent_status in ('YES', 'NO', 'DISCONTINUED')),
  ownership_position_status text not null default 'NO' check (ownership_position_status in ('YES', 'NO', 'DISCONTINUED')),
  equity_status text not null default 'NO' check (equity_status in ('YES', 'NO', 'DISCONTINUED')),
  winning_portfolio_status text not null default 'NO' check (winning_portfolio_status in ('YES', 'NO', 'DISCONTINUED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.iv_referral_leads (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null references public.iv_user_profiles(privy_user_id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  best_time_to_call text,
  profession text,
  link_sent boolean not null default false,
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.iv_status_tickets (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null references public.iv_user_profiles(privy_user_id) on delete cascade,
  name text,
  email text,
  subject text not null,
  message text not null,
  admin_response text,
  status text not null default 'PENDING' check (status in ('PENDING', 'RESPONDED', 'CLOSED')),
  last_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists iv_referral_leads_privy_user_id_created_at_idx
  on public.iv_referral_leads (privy_user_id, created_at desc);

create index if not exists iv_status_tickets_privy_user_id_created_at_idx
  on public.iv_status_tickets (privy_user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_iv_user_profiles_updated_at on public.iv_user_profiles;
create trigger set_iv_user_profiles_updated_at
before update on public.iv_user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_user_positions_updated_at on public.iv_user_positions;
create trigger set_iv_user_positions_updated_at
before update on public.iv_user_positions
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_referral_leads_updated_at on public.iv_referral_leads;
create trigger set_iv_referral_leads_updated_at
before update on public.iv_referral_leads
for each row execute function public.set_updated_at();

drop trigger if exists set_iv_status_tickets_updated_at on public.iv_status_tickets;
create trigger set_iv_status_tickets_updated_at
before update on public.iv_status_tickets
for each row execute function public.set_updated_at();

alter table public.iv_user_profiles enable row level security;
alter table public.iv_user_positions enable row level security;
alter table public.iv_referral_leads enable row level security;
alter table public.iv_status_tickets enable row level security;
