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

create table if not exists support_channels (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  channel_type text not null,
  name text not null,
  status text not null default 'demo',
  difficulty text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists support_channel_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  channel_id uuid not null references support_channels(id),
  account_ref text not null,
  encrypted_secret bytea,
  scopes text[] not null default '{}',
  status text not null default 'not_connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  display_name text not null,
  primary_email text,
  primary_phone text,
  country text,
  language text not null default 'zh-CN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_identities (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  channel_type text not null,
  external_user_id text not null,
  display_name text,
  created_at timestamptz not null default now(),
  unique (tenant_id, channel_type, external_user_id)
);

create table if not exists customer_threads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid references customers(id),
  channel_type text not null,
  subject text not null,
  status text not null default 'open',
  risk_level text not null default 'low',
  language text not null default 'zh-CN',
  order_ref text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  thread_id uuid not null references customer_threads(id),
  channel_type text not null,
  direction text not null,
  sender_type text not null,
  sender_ref text,
  original_text text not null,
  original_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists message_translations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  message_id uuid not null references messages(id),
  source_language text not null,
  target_language text not null,
  translated_text text not null,
  model_name text not null,
  human_edited boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ai_reply_suggestions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  thread_id uuid not null references customer_threads(id),
  message_id uuid references messages(id),
  draft_text text not null,
  risk_level text not null,
  reason text not null,
  status text not null default 'pending_review',
  can_auto_send boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ai_outputs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  source_type text not null,
  source_id uuid,
  model_name text not null,
  prompt_hash text,
  output_text text not null,
  risk_level text,
  status text not null default 'generated',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_autoreplies (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  thread_id uuid not null references customer_threads(id),
  message_id uuid references messages(id),
  reply_text text not null,
  risk_level text not null,
  sent_at timestamptz,
  blocked_reason text,
  created_at timestamptz not null default now()
);

create table if not exists ai_approvals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  source_type text not null,
  source_id uuid not null,
  risk_level text not null,
  decision text not null,
  approver_ref text,
  final_text text,
  human_edited boolean not null default false,
  decided_at timestamptz not null default now()
);

create table if not exists handoff_reports (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  report_date date not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  new_threads_count integer not null default 0,
  ai_replies_count integer not null default 0,
  needs_human_count integer not null default 0,
  high_risk_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
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

create index if not exists idx_customer_threads_tenant_status
  on customer_threads(tenant_id, status, last_message_at desc);

create index if not exists idx_messages_thread_created
  on messages(thread_id, created_at);

create index if not exists idx_ai_reply_suggestions_thread_status
  on ai_reply_suggestions(thread_id, status);
