-- iv_payments: Stripe payment audit trail
-- Safe to apply: uses CREATE TABLE IF NOT EXISTS, no destructive ops.

CREATE TABLE IF NOT EXISTS public.iv_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id text NOT NULL,
  email text,
  stripe_customer_id text,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_event_id text UNIQUE,
  price_id text NOT NULL,
  tier text NOT NULL,
  amount_total integer,
  currency text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_iv_payments_privy_user_id
  ON public.iv_payments (privy_user_id);

CREATE INDEX IF NOT EXISTS idx_iv_payments_stripe_customer_id
  ON public.iv_payments (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_iv_payments_status
  ON public.iv_payments (status);

-- Reuse the existing set_updated_at trigger function (created in member entitlements migration)
DROP TRIGGER IF EXISTS set_iv_payments_updated_at ON public.iv_payments;
CREATE TRIGGER set_iv_payments_updated_at
  BEFORE UPDATE ON public.iv_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.iv_payments ENABLE ROW LEVEL SECURITY;
