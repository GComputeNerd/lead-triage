create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  contact text not null,
  message text not null,
  utm_source text,
  utm_campaign text,
  intent text,
  score text check (score in ('hot','warm','cold')),
  urgency text,
  summary text,
  suggested_reply text,
  needs_review boolean not null default false,
  status text not null default 'new'
    check (status in ('new','contacted','won','lost')),
  llm_latency_ms int,
  dedupe_key text unique
);

alter table leads enable row level security;

create policy "staff read" on leads
  for select to authenticated using (true);
create policy "staff update" on leads
  for update to authenticated using (true);