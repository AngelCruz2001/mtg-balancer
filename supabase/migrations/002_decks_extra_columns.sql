ALTER TABLE public.decks ADD COLUMN bracket integer CHECK (bracket BETWEEN 1 AND 4);
ALTER TABLE public.decks ADD COLUMN description text;
ALTER TABLE public.decks ADD COLUMN estimated_value numeric(10,2);

CREATE OR REPLACE FUNCTION public.get_wins_by_commander()
RETURNS TABLE(commander text, wins bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT mp.commander, COUNT(*) AS wins
  FROM public.match_players mp
  JOIN public.matches m ON m.id = mp.match_id
  WHERE m.winner_seat = mp.seat AND mp.commander IS NOT NULL
  GROUP BY mp.commander;
$$;
