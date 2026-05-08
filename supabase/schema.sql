-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup (reads name from user_metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Player'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Matches ───────────────────────────────────────────────────────────────
CREATE TABLE public.matches (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  played_at            timestamptz NOT NULL DEFAULT now(),
  duration_seconds     integer,
  winner_seat          integer CHECK (winner_seat BETWEEN 1 AND 4),
  analysis_explanation text,
  created_at           timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all matches"
  ON public.matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own matches"
  ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own matches"
  ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- ── Match Players ─────────────────────────────────────────────────────────
CREATE TABLE public.match_players (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id      uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  seat          integer NOT NULL CHECK (seat BETWEEN 1 AND 4),
  player_name   text NOT NULL,
  commander     text,
  colors        text[],
  deck_raw      text,
  score         integer,
  score_summary text,
  life_final    integer,
  UNIQUE(match_id, seat)
);

ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all match_players"
  ON public.match_players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert match_players for their own matches"
  ON public.match_players FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.created_by = auth.uid()
    )
  );

-- ── Deck Library ──────────────────────────────────────────────────────────
CREATE TABLE public.decks (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  commander    text,
  colors       text[],
  moxfield_url text,
  deck_raw     text NOT NULL,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view decks"
  ON public.decks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own decks"
  ON public.decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own decks"
  ON public.decks FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own decks"
  ON public.decks FOR DELETE TO authenticated USING (auth.uid() = created_by);
