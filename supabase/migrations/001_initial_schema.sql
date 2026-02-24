-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Leads table
create table leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  slack_message_ts text,
  company_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  job_title text,
  state text,
  country text,
  use_case text,
  timeline text,
  lead_source text,
  lead_score integer,
  tell_us_more text,
  status text default 'pending' check (status in ('pending', 'validating', 'researching', 'complete', 'invalid')),
  is_valid boolean,
  validation_reason text,
  raw_slack_message text
);

-- Reports table
create table reports (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  created_at timestamp with time zone default now(),
  company_summary text,
  company_logo_url text,
  company_website text,
  company_industry text,
  company_size text,
  company_location text,
  recent_news jsonb default '[]',
  social_profiles jsonb default '{}',
  primary_use_case_analysis text,
  recommended_robot text,
  recommended_robot_reasoning text,
  additional_opportunities jsonb default '[]',
  salesperson_talking_points jsonb default '[]',
  roi_angles jsonb default '[]',
  risk_factors jsonb default '[]',
  competitor_context text,
  overall_score integer,
  report_html text
);

-- Research sources table
create table research_sources (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports(id) on delete cascade,
  source_url text,
  source_title text,
  source_type text check (source_type in ('news', 'blog', 'social', 'website', 'review')),
  snippet text,
  fetched_at timestamp with time zone default now()
);

-- Indexes
create index idx_leads_status on leads(status);
create index idx_leads_created_at on leads(created_at desc);
create index idx_reports_lead_id on reports(lead_id);
create index idx_research_sources_report_id on research_sources(report_id);

-- Enable Row Level Security
alter table leads enable row level security;
alter table reports enable row level security;
alter table research_sources enable row level security;

-- RLS policies (allow authenticated users from @standardbots.com)
create policy "Authenticated users can read leads" on leads for select using (auth.role() = 'authenticated');
create policy "Service role can insert leads" on leads for insert with check (true);
create policy "Service role can update leads" on leads for update using (true);

create policy "Authenticated users can read reports" on reports for select using (auth.role() = 'authenticated');
create policy "Service role can insert reports" on reports for insert with check (true);
create policy "Service role can update reports" on reports for update using (true);

create policy "Authenticated users can read sources" on research_sources for select using (auth.role() = 'authenticated');
create policy "Service role can insert sources" on research_sources for insert with check (true);
