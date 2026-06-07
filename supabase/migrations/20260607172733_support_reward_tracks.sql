alter table public.iv_payout_jobs
  add column if not exists reward_track text not null default 'full_academy',
  add column if not exists access_type text not null default 'all_modules',
  add column if not exists module_number integer null,
  add column if not exists entitlement_id uuid null;

alter table public.iv_payout_transactions
  add column if not exists reward_track text not null default 'full_academy',
  add column if not exists access_type text not null default 'all_modules',
  add column if not exists module_number integer null,
  add column if not exists entitlement_id uuid null;

update public.iv_payout_jobs
set reward_track = 'full_academy',
    access_type = 'all_modules',
    module_number = null
where reward_track is null
   or access_type is null
   or reward_track = 'full_academy';

update public.iv_payout_transactions
set reward_track = 'full_academy',
    access_type = 'all_modules',
    module_number = null
where reward_track is null
   or access_type is null
   or reward_track = 'full_academy';

alter table public.iv_payout_jobs
  alter column milestone_number drop not null;

alter table public.iv_payout_transactions
  alter column milestone_number drop not null;

alter table public.iv_payout_jobs
  drop constraint if exists iv_payout_jobs_privy_user_id_milestone_number_key,
  drop constraint if exists iv_payout_jobs_milestone_number_check,
  drop constraint if exists iv_payout_jobs_reward_track_check,
  drop constraint if exists iv_payout_jobs_access_type_check,
  drop constraint if exists iv_payout_jobs_module_number_check,
  drop constraint if exists iv_payout_jobs_reward_track_shape_check;

alter table public.iv_payout_transactions
  drop constraint if exists iv_payout_transactions_milestone_number_check,
  drop constraint if exists iv_payout_transactions_reward_track_check,
  drop constraint if exists iv_payout_transactions_access_type_check,
  drop constraint if exists iv_payout_transactions_module_number_check,
  drop constraint if exists iv_payout_transactions_reward_track_shape_check;

alter table public.iv_payout_jobs
  add constraint iv_payout_jobs_reward_track_check
    check (reward_track in ('full_academy', 'single_module')),
  add constraint iv_payout_jobs_access_type_check
    check (access_type in ('all_modules', 'single_module')),
  add constraint iv_payout_jobs_module_number_check
    check (module_number is null or module_number between 1 and 6),
  add constraint iv_payout_jobs_reward_track_shape_check
    check (
      (
        reward_track = 'full_academy'
        and access_type = 'all_modules'
        and milestone_number between 1 and 3
        and module_number is null
      )
      or
      (
        reward_track = 'single_module'
        and access_type = 'single_module'
        and milestone_number is null
        and module_number between 1 and 6
      )
    );

alter table public.iv_payout_transactions
  add constraint iv_payout_transactions_reward_track_check
    check (reward_track in ('full_academy', 'single_module')),
  add constraint iv_payout_transactions_access_type_check
    check (access_type in ('all_modules', 'single_module')),
  add constraint iv_payout_transactions_module_number_check
    check (module_number is null or module_number between 1 and 6),
  add constraint iv_payout_transactions_reward_track_shape_check
    check (
      (
        reward_track = 'full_academy'
        and access_type = 'all_modules'
        and milestone_number between 1 and 3
        and module_number is null
      )
      or
      (
        reward_track = 'single_module'
        and access_type = 'single_module'
        and milestone_number is null
        and module_number between 1 and 6
      )
    );

create unique index if not exists iv_payout_jobs_unique_full_academy
  on public.iv_payout_jobs (privy_user_id, milestone_number)
  where reward_track = 'full_academy';

create unique index if not exists iv_payout_jobs_unique_single_module
  on public.iv_payout_jobs (privy_user_id, entitlement_id, module_number)
  where reward_track = 'single_module' and entitlement_id is not null;

create unique index if not exists iv_payout_jobs_unique_single_module_no_entitlement
  on public.iv_payout_jobs (privy_user_id, module_number)
  where reward_track = 'single_module' and entitlement_id is null;

create index if not exists idx_iv_payout_jobs_reward_track
  on public.iv_payout_jobs (reward_track);

create index if not exists idx_iv_payout_jobs_module_number
  on public.iv_payout_jobs (module_number);

create index if not exists idx_iv_payout_transactions_reward_track
  on public.iv_payout_transactions (reward_track);

create index if not exists idx_iv_payout_transactions_module_number
  on public.iv_payout_transactions (module_number);
