-- Favorites table
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  generation_id uuid NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, generation_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Playlists table
CREATE TABLE public.playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own playlists"
ON public.playlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
ON public.playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
ON public.playlists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
ON public.playlists FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Playlist items table
CREATE TABLE public.playlist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, generation_id)
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Use security definer function to check playlist ownership
CREATE OR REPLACE FUNCTION public.is_playlist_owner(_user_id uuid, _playlist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.playlists
    WHERE id = _playlist_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Users can view their playlist items"
ON public.playlist_items FOR SELECT
USING (is_playlist_owner(auth.uid(), playlist_id));

CREATE POLICY "Users can add to their playlists"
ON public.playlist_items FOR INSERT
WITH CHECK (is_playlist_owner(auth.uid(), playlist_id));

CREATE POLICY "Users can update their playlist items"
ON public.playlist_items FOR UPDATE
USING (is_playlist_owner(auth.uid(), playlist_id));

CREATE POLICY "Users can remove from their playlists"
ON public.playlist_items FOR DELETE
USING (is_playlist_owner(auth.uid(), playlist_id));
