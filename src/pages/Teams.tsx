import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Plus, Trash2, Users, Crown, UserPlus, Loader2, LogOut as LeaveIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchTeams();
  }, [user, authLoading]);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });
    setTeams(data || []);
    setLoading(false);
  };

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert({ name: newTeamName.trim(), owner_id: user.id })
        .select()
        .single();
      if (error) throw error;

      // Add owner as a member too
      await supabase.from("team_members").insert({
        team_id: data.id,
        user_id: user.id,
        role: "owner",
      });

      setNewTeamName("");
      fetchTeams();
      toast({ title: "Team created!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to create team", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const selectTeam = async (team: Team) => {
    setSelectedTeam(team);
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", team.id);

    if (data) {
      // Fetch profiles for each member
      const memberIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", memberIds);

      const membersWithProfiles = data.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.user_id) || null,
      }));
      setMembers(membersWithProfiles);
    }
  };

  const handleInvite = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Look up user by email via profiles — we need to find user_id
      // Since we can't query auth.users, we check profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", inviteEmail.trim())
        .maybeSingle();

      if (!profile) {
        toast({
          title: "User not found",
          description: "Ask them to sign up first, then try their display name.",
          variant: "destructive",
        });
        setInviting(false);
        return;
      }

      const { error } = await supabase.from("team_members").insert({
        team_id: selectedTeam.id,
        user_id: profile.user_id,
        role: "member",
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already a member", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        setInviteEmail("");
        selectTeam(selectedTeam);
        toast({ title: "Member added!" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to add member", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (!error && selectedTeam) {
      selectTeam(selectedTeam);
      toast({ title: "Member removed" });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (!error) {
      setSelectedTeam(null);
      fetchTeams();
      toast({ title: "Team deleted" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-display text-lg font-semibold">Teams</span>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-12 space-y-8">
        {/* Create team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-4"
        >
          <h3 className="font-display text-lg font-semibold">Create a Team</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-card border-border"
            />
            <Button variant="hero" onClick={handleCreateTeam} disabled={creating || !newTeamName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </div>
        </motion.div>

        {/* Team list */}
        <div className="space-y-3">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`glass-card p-4 cursor-pointer transition-colors ${
                selectedTeam?.id === team.id ? "border-primary/40" : ""
              }`}
              onClick={() => selectTeam(team)}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(team.created_at).toLocaleDateString()}
                    {team.owner_id === user?.id && " · Owner"}
                  </p>
                </div>
                {team.owner_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}

          {teams.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No teams yet. Create one to start collaborating.
            </p>
          )}
        </div>

        {/* Selected team members */}
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-display text-lg font-semibold">
              {selectedTeam.name} — Members
            </h3>

            {selectedTeam.owner_id === user?.id && (
              <div className="flex gap-3">
                <Input
                  placeholder="Member's display name"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-card border-border"
                />
                <Button variant="hero" size="sm" onClick={handleInvite} disabled={inviting}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-2">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {member.profile?.display_name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1">
                      {member.role === "owner" && <Crown className="h-3 w-3 text-primary" />}
                      <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                    </div>
                  </div>
                  {selectedTeam.owner_id === user?.id && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Teams;
