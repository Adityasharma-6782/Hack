CREATE TABLE public.question_overrides (
  id text PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.question_overrides TO service_role;
ALTER TABLE public.question_overrides ENABLE ROW LEVEL SECURITY;
