
-- Create table for storing TTS generations
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  text_input TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own generations
CREATE POLICY "Users can view their own generations"
ON public.generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generations"
ON public.generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations"
ON public.generations FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for generated audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-generations', 'audio-generations', true);

-- Storage policies
CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-generations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can listen to audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-generations');

CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-generations' AND auth.uid()::text = (storage.foldername(name))[1]);
