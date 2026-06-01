create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists integrations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  provider text not null,
  status text not null default 'not_connected',
  account_ref text,
  encrypted_secret bytea,
  last_sync_at timestamptz,
  rate_limit_state jsonb not null default '{}'::jsonb,
  circuit_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists creators (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  platform text not null,
  handle text not null,
  country text not null,
  followers integer not null default 0,
  avg_views integer not null default 0,
  engagement_rate_bps integer not null default 0,
  ai_score integer not null default 0,
  status text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists creatives (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  source text not null,
  platform text not null,
  country text,
  title text not null,
  hook_score integer not null,
  completion_score integer not null,
  click_score integer not null,
  scale_score integer not null,
  status text not null,
  asset_url text,
  created_at timestamptz not null default now()
);

create table if not exists ad_metrics (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  creative_id uuid references creatives(id),
  country text not null,
  audience text,
  spend_cents bigint not null,
  revenue_cents bigint not null,
  gross_profit_cents bigint not null,
  impressions integer not null,
  clicks integer not null,
  orders integer not null,
  cpa_cents bigint not null,
  roas_bps integer not null,
  metric_date date not null
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  external_order_id text not null,
  customer_ref text not null,
  country text not null,
  channel text not null,
  revenue_cents bigint not null,
  gross_profit_cents bigint not null,
  customization jsonb not null default '{}'::jsonb,
  fulfillment_status text not null,
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists ai_actions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  owner_role text not null,
  action_type text not null,
  title text not null,
  detail text not null,
  risk_level text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists gdpr_requests (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  identity text not null,
  mode text not null,
  status text not null default 'queued',
  affected_systems text[] not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  actor text not null,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
