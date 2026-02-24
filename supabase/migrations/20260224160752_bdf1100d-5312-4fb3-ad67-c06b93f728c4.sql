-- Add tags column to generations
ALTER TABLE public.generations ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

-- Add GIN index for efficient tag queries
CREATE INDEX idx_generations_tags ON public.generations USING GIN(tags);
