
-- API Keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
ON public.api_keys FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = _team_id AND owner_id = _user_id
  )
$$;

-- Team RLS policies
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their teams"
ON public.teams FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their teams"
ON public.teams FOR DELETE USING (auth.uid() = owner_id);

-- Team members RLS policies
CREATE POLICY "Team members can view members"
ON public.team_members FOR SELECT
USING (public.is_team_member(auth.uid(), team_id) OR public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can add members"
ON public.team_members FOR INSERT
WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can remove members"
ON public.team_members FOR DELETE
USING (public.is_team_owner(auth.uid(), team_id) OR auth.uid() = user_id);

-- Add team_id to generations for shared access
ALTER TABLE public.generations ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Update generations policies to allow team access
DROP POLICY "Users can view their own generations" ON public.generations;
CREATE POLICY "Users can view own or team generations"
ON public.generations FOR SELECT
USING (
  auth.uid() = user_id 
  OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
);

-- Make profiles viewable by team members (for displaying names)
DROP POLICY "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
USING (true);
