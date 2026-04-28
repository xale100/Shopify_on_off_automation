-- Merchants table: one row per installed Shopify store
CREATE TABLE merchants (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain          TEXT NOT NULL UNIQUE,
  encrypted_access_token TEXT NOT NULL,
  merchant_email       TEXT,
  timezone             TEXT NOT NULL DEFAULT 'UTC',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  is_flagged           BOOLEAN NOT NULL DEFAULT false,
  current_store_state  TEXT NOT NULL DEFAULT 'open' CHECK (current_store_state IN ('open', 'closed')),
  last_toggle_at       TIMESTAMPTZ,
  billing_charge_id    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedule windows: multiple windows per day (e.g. open 11-14, open again 17-21)
-- No unique constraint on (merchant_id, day_of_week) — multiple windows allowed
CREATE TABLE schedule_windows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time    TIME NOT NULL,
  close_time   TIME NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_windows_merchant ON schedule_windows(merchant_id);
CREATE INDEX idx_merchants_shop_domain ON merchants(shop_domain);

-- Enable RLS on both tables.
-- The app exclusively uses the service role key (server-side), which bypasses RLS.
-- RLS here acts as a safety net: anon/public keys have zero access.
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_windows ENABLE ROW LEVEL SECURITY;
