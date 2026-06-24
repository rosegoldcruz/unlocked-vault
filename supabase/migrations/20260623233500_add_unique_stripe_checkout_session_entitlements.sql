create unique index if not exists iv_member_entitlements_unique_stripe_checkout_session_id
  on public.iv_member_entitlements (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
