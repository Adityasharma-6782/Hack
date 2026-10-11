CREATE TABLE public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  session_token text,
  question_order text[] not null default '{}',
  active_question_id text,
  points integer not null default 0,
  hints_used jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_solve_at timestamptz
);
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.solves (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  question_id text not null,
  points integer not null,
  solved_at timestamptz not null default now(),
  unique (team_id, question_id)
);
GRANT ALL ON public.solves TO service_role;
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;