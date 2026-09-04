alter table public.iv_member_entitlements
  add column if not exists package text,
  add column if not exists core_academy_access text,
  add column if not exists developer_lab_access boolean;

alter table public.iv_member_entitlements
  drop constraint if exists iv_member_entitlements_package_check;
alter table public.iv_member_entitlements
  add constraint iv_member_entitlements_package_check
  check (package is null or package in ('ENTRY_LEVEL', 'INTERMEDIATE', 'ADVANCED', 'ELITE'));

alter table public.iv_member_entitlements
  drop constraint if exists iv_member_entitlements_core_academy_access_check;
alter table public.iv_member_entitlements
  add constraint iv_member_entitlements_core_academy_access_check
  check (core_academy_access is null or core_academy_access in ('FREE', 'FULL'));

update public.iv_member_entitlements
set
  package = case
    when upper(coalesce(metadata->>'package', metadata->>'package_key', metadata->>'product_key', metadata->>'legacy_tier', metadata->>'legacyTier', metadata->>'payment_tier', metadata->>'paymentTier', metadata->>'tier', '')) in ('ELITE', 'FOUNDER', 'FOUNDER_ELITE') then 'ELITE'
    when upper(coalesce(metadata->>'package', metadata->>'package_key', metadata->>'product_key', metadata->>'legacy_tier', metadata->>'legacyTier', metadata->>'payment_tier', metadata->>'paymentTier', metadata->>'tier', '')) in ('ADVANCED', 'BUILDER', 'BUILDER_ACCELERATOR', 'ACCELERATOR') then 'ADVANCED'
    when upper(coalesce(metadata->>'package', metadata->>'package_key', metadata->>'product_key', metadata->>'legacy_tier', metadata->>'legacyTier', metadata->>'payment_tier', metadata->>'paymentTier', metadata->>'tier', '')) in ('INTERMEDIATE', 'FOUNDATION', 'STARTER') then 'INTERMEDIATE'
    else 'ENTRY_LEVEL'
  end,
  core_academy_access = case
    when upper(coalesce(metadata->>'package', metadata->>'package_key', metadata->>'product_key', metadata->>'legacy_tier', metadata->>'legacyTier', metadata->>'payment_tier', metadata->>'paymentTier', metadata->>'tier', '')) in ('ELITE', 'FOUNDER', 'FOUNDER_ELITE', 'ADVANCED', 'BUILDER', 'BUILDER_ACCELERATOR', 'ACCELERATOR', 'INTERMEDIATE', 'FOUNDATION', 'STARTER') then 'FULL'
    else 'FREE'
  end,
  developer_lab_access = upper(coalesce(metadata->>'package', metadata->>'package_key', metadata->>'product_key', metadata->>'legacy_tier', metadata->>'legacyTier', metadata->>'payment_tier', metadata->>'paymentTier', metadata->>'tier', '')) in ('ELITE', 'FOUNDER', 'FOUNDER_ELITE')
where package is null or core_academy_access is null or developer_lab_access is null;

create index if not exists idx_iv_member_entitlements_package
  on public.iv_member_entitlements (package);