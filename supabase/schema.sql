-- Supabase schema for IA BOCK chatbot

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password text not null,
  role text not null default 'user',
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null, -- 'user' | 'assistant' | 'system'
  content text not null,
  created_at timestamptz default now()
);

-- Insert admin user (set your own password hash or replace later)
-- Use Supabase SQL editor to insert hashed password using your tool of choice.
-- Example (do not run with plain password):
-- insert into users (email, password, role) values ('administrador', '<bcrypt-hash-of-adm2026>', 'admin');

-- Indexes
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_conversations_user on conversations(user_id);
