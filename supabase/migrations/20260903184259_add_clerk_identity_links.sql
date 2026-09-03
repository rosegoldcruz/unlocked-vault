create extension if not exists pgcrypto;

create table if not exists public.iv_auth_identity_links (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  privy_user_id text not null,
  email text null,
  wallet_address text null,
  link_strategy text not null,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    link_strategy in (
      'existing_link',
      'trusted_clerk_legacy_id',
      'verified_email',
      'verified_wallet',
      'verified_identity',
      'new_clerk_user',
      'webhook'
    )
  )
);

create index if not exists idx_iv_auth_identity_links_privy_user_id
  on public.iv_auth_identity_links (privy_user_id);
create index if not exists idx_iv_auth_identity_links_email
  on public.iv_auth_identity_links (email);
create index if not exists idx_iv_auth_identity_links_wallet_address
  on public.iv_auth_identity_links (wallet_address);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_iv_auth_identity_links_updated_at on public.iv_auth_identity_links;
create trigger set_iv_auth_identity_links_updated_at
before update on public.iv_auth_identity_links
for each row execute function public.set_updated_at();

alter table public.iv_auth_identity_links enable row level security;

comment on table public.iv_auth_identity_links is
  'Maps Clerk authenticated users to the existing Iron Vault legacy privy_user_id application identity.';
