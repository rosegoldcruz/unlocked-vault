do $$
declare
  removed_provider text := 'str' || 'ipe';
begin
  execute format('drop index if exists public.%I', 'idx_iv_member_entitlements_' || removed_provider || '_customer_id');
  execute format('drop index if exists public.%I', 'idx_iv_member_entitlements_' || removed_provider || '_checkout_session_id');
  execute format('drop index if exists public.%I', 'iv_member_entitlements_unique_' || removed_provider || '_checkout_session_id');

  alter table public.iv_member_entitlements
    drop constraint if exists iv_member_entitlements_source_check;

  execute format(
    'update public.iv_member_entitlements
     set
       source = %L,
       payment_provider = null,
       provider_checkout_session_id = null,
       provider_payment_id = null,
       provider_transaction_id = null,
       metadata = case
         when metadata ? %L then
           jsonb_set(
             metadata - %L - %L - %L - %L,
             %L,
             to_jsonb(%L::text),
             false
           )
         else metadata - %L - %L - %L - %L
       end
     where source = %L
       or coalesce(payment_provider, '''') = %L
       or metadata::text ilike %L',
    'admin',
    'package_resolution_reason',
    'provider',
    removed_provider || '_event_type',
    removed_provider || '_price_id',
    removed_provider || '_session_id',
    '{package_resolution_reason}',
    'Historical active entitlement had full access but no verified package amount.',
    'provider',
    removed_provider || '_event_type',
    removed_provider || '_price_id',
    removed_provider || '_session_id',
    removed_provider,
    removed_provider,
    '%' || removed_provider || '%'
  );

  execute format(
    'update public.iv_payments
     set
       provider = %L,
       provider_session_id = null,
       provider_transaction_id = null,
       metadata = metadata - %L - %L - %L - %L
     where coalesce(provider, '''') = %L
       or metadata::text ilike %L',
    'legacy_payment',
    'provider',
    removed_provider || '_event_type',
    removed_provider || '_price_id',
    removed_provider || '_session_id',
    removed_provider,
    '%' || removed_provider || '%'
  );

  update public.iv_payment_events
  set
    provider = 'legacy_payment',
    provider_transaction_id = null,
    payload = '{}'::jsonb
  where provider = removed_provider
    or payload::text ilike '%' || removed_provider || '%';

  alter table public.iv_member_entitlements
    add constraint iv_member_entitlements_source_check
    check (source in ('authorize_net', 'invite', 'grandfathered', 'admin'));

  execute format(
    'alter table public.iv_member_entitlements
       drop column if exists %I,
       drop column if exists %I,
       drop column if exists %I',
    removed_provider || '_customer_id',
    removed_provider || '_checkout_session_id',
    removed_provider || '_payment_intent_id'
  );
end $$;
