CREATE TABLE public.rooms (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text UNIQUE NOT NULL,
  players     jsonb NOT NULL DEFAULT '[]',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- No auth required — the room code itself acts as the access token
CREATE POLICY "Anyone can create rooms"
  ON public.rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can update rooms"
  ON public.rooms FOR UPDATE USING (true);

-- Enable Realtime so guests receive live deck updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
