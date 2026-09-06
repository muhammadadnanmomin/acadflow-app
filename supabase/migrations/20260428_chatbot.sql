-- ============================================================
-- Confairo Chatbot System — Supabase Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable pgvector extension (free, built into Supabase)
create extension if not exists vector;

-- ============================================================
-- 2. Chat Sessions
-- ============================================================
create table if not exists chatbot_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  user_role   text default 'guest',        -- guest | participant | organizer | reviewer | admin
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table chatbot_sessions enable row level security;

create policy "Users can view their own sessions"
  on chatbot_sessions for select
  using (auth.uid() = user_id or user_id is null);

create policy "Anyone can insert sessions"
  on chatbot_sessions for insert
  with check (true);

create policy "Service role full access to sessions"
  on chatbot_sessions for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 3. Chat Messages
-- ============================================================
create table if not exists chatbot_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references chatbot_sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  created_at  timestamptz default now()
);

alter table chatbot_messages enable row level security;

create policy "Users can view messages in their sessions"
  on chatbot_messages for select
  using (
    session_id in (
      select id from chatbot_sessions where user_id = auth.uid() or user_id is null
    )
  );

create policy "Service role full access to messages"
  on chatbot_messages for all
  using (auth.role() = 'service_role');

create index chatbot_messages_session_idx on chatbot_messages(session_id, created_at);

-- ============================================================
-- 4. RAG Knowledge Base (pgvector)
-- ============================================================
create table if not exists chatbot_documents (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  embedding   vector(768),                -- Gemini text-embedding-004 dimension
  metadata    jsonb default '{}',         -- { type, title, source, tags }
  created_at  timestamptz default now()
);

alter table chatbot_documents enable row level security;

create policy "Public read access to chatbot documents"
  on chatbot_documents for select
  using (true);

create policy "Service role full access to documents"
  on chatbot_documents for all
  using (auth.role() = 'service_role');

-- IVFFlat index for fast approximate nearest-neighbour search
create index if not exists chatbot_documents_embedding_idx
  on chatbot_documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ============================================================
-- 5. Chatbot Settings (single-row admin config)
-- ============================================================
create table if not exists chatbot_settings (
  id              integer primary key default 1 check (id = 1), -- enforce singleton
  enabled         boolean default true,
  welcome_message text default 'Hi! I''m Confairo AI 👋 I can help you discover conferences, track submissions, check deadlines, and navigate the platform. How can I assist you today?',
  bot_name        text default 'Confairo AI',
  primary_color   text default '#3b4fd4',
  updated_at      timestamptz default now()
);

alter table chatbot_settings enable row level security;

create policy "Public read access to settings"
  on chatbot_settings for select
  using (true);

create policy "Service role can update settings"
  on chatbot_settings for all
  using (auth.role() = 'service_role');

-- Insert default settings row
insert into chatbot_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- 6. RPC — Semantic Search Function for RAG
-- ============================================================
create or replace function match_chatbot_documents (
  query_embedding   vector(768),
  match_threshold   float    default 0.5,
  match_count       int      default 5
)
returns table (
  id        uuid,
  content   text,
  metadata  jsonb,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from chatbot_documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
