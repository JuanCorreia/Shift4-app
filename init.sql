-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('analyst', 'admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM ('draft', 'review', 'approved', 'sent', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'analyst',
  invite_code VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Team settings table
CREATE TABLE IF NOT EXISTS team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code VARCHAR(255) NOT NULL UNIQUE,
  team_name VARCHAR(255),
  anthropic_api_key VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name VARCHAR(255) NOT NULL,
  hotel_group VARCHAR(255),
  star_rating INTEGER,
  property_count INTEGER DEFAULT 1,
  location VARCHAR(255),
  annual_volume NUMERIC(15,2) NOT NULL,
  avg_transaction_size NUMERIC(10,2) NOT NULL,
  card_mix_visa NUMERIC(5,2) DEFAULT 40,
  card_mix_mastercard NUMERIC(5,2) DEFAULT 35,
  card_mix_amex NUMERIC(5,2) DEFAULT 15,
  card_mix_other NUMERIC(5,2) DEFAULT 10,
  card_mix_international NUMERIC(5,2) DEFAULT 25,
  card_mix_corporate NUMERIC(5,2) DEFAULT 15,
  card_mix_debit NUMERIC(5,2) DEFAULT 30,
  current_processor VARCHAR(255),
  current_blended_rate NUMERIC(6,2),
  current_tx_fee NUMERIC(6,4),
  current_monthly_fee NUMERIC(10,2),
  dcc_eligible BOOLEAN DEFAULT FALSE,
  dcc_uptake NUMERIC(5,2) DEFAULT 0,
  dcc_markup NUMERIC(5,2) DEFAULT 2.5,
  pricing_result JSONB,
  narrative TEXT,
  statement_url VARCHAR(500),
  ocr_data JSONB,
  mode VARCHAR(10) NOT NULL DEFAULT 'wizard',
  status deal_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Deal history table
CREATE TABLE IF NOT EXISTS deal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  field VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed: default team with invite code "shift4team"
INSERT INTO team_settings (invite_code, team_name)
VALUES ('shift4team', 'Shift4 Hospitality Team')
ON CONFLICT (invite_code) DO NOTHING;

-- Seed: admin user
INSERT INTO users (name, email, role, invite_code)
VALUES ('Admin', 'admin@shift4.com', 'admin', 'shift4team')
ON CONFLICT (email) DO NOTHING;
