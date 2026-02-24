-- Add is_published flag to generations
ALTER TABLE public.generations ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- Add UPDATE policy so users can toggle publish status
CREATE POLICY "Users can update their own generations"
ON public.generations
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow public SELECT on published episodes (for RSS feed)
CREATE POLICY "Anyone can view published generations"
ON public.generations
FOR SELECT
USING (is_published = true);
