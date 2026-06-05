create extension if not exists pgcrypto;

create table if not exists public.iv_member_entitlements (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text null,
  email text null,
  wallet_address text null,
  source text not null,
  status text not null default 'active',
  stripe_customer_id text null,
  stripe_checkout_session_id text null,
  stripe_payment_intent_id text null,
  invite_code text null,
  granted_by text null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'revoked', 'expired')),
  check (source in ('stripe', 'invite', 'grandfathered', 'admin')),
  check (
    privy_user_id is not null
    or email is not null
    or wallet_address is not null
  )
);

create index if not exists idx_iv_member_entitlements_privy_user_id
  on public.iv_member_entitlements (privy_user_id);
create index if not exists idx_iv_member_entitlements_email
  on public.iv_member_entitlements (email);
create index if not exists idx_iv_member_entitlements_wallet_address
  on public.iv_member_entitlements (wallet_address);
create index if not exists idx_iv_member_entitlements_status
  on public.iv_member_entitlements (status);
create index if not exists idx_iv_member_entitlements_source
  on public.iv_member_entitlements (source);
create index if not exists idx_iv_member_entitlements_stripe_customer_id
  on public.iv_member_entitlements (stripe_customer_id);
create index if not exists idx_iv_member_entitlements_stripe_checkout_session_id
  on public.iv_member_entitlements (stripe_checkout_session_id);
create index if not exists idx_iv_member_entitlements_invite_code
  on public.iv_member_entitlements (invite_code);

create table if not exists public.iv_member_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  email text null,
  wallet_address text null,
  status text not null default 'active',
  max_uses integer not null default 1,
  used_count integer not null default 0,
  created_by text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  check (status in ('active', 'used', 'revoked', 'expired')),
  check (max_uses > 0),
  check (used_count >= 0),
  check (used_count <= max_uses)
);

create index if not exists idx_iv_member_invites_email
  on public.iv_member_invites (email);
create index if not exists idx_iv_member_invites_wallet_address
  on public.iv_member_invites (wallet_address);
create index if not exists idx_iv_member_invites_status
  on public.iv_member_invites (status);
create index if not exists idx_iv_member_invites_created_by
  on public.iv_member_invites (created_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_iv_member_entitlements_updated_at on public.iv_member_entitlements;
create trigger set_iv_member_entitlements_updated_at
before update on public.iv_member_entitlements
for each row execute function public.set_updated_at();

alter table public.iv_member_entitlements enable row level security;
alter table public.iv_member_invites enable row level security;
