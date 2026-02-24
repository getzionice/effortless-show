import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Download, Trash2, Mic2, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Generation {
  id: string;
  title: string | null;
  text_input: string;
  voice_name: string;
  audio_url: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchGenerations();
  }, [user, authLoading]);

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch generations:", error);
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (gen: Generation) => {
    setDeletingId(gen.id);
    try {
      // Delete audio from storage if exists
      if (gen.audio_url) {
        const path = gen.audio_url.split("/audio-generations/")[1];
        if (path) {
          await supabase.storage.from("audio-generations").remove([path]);
        }
      }
      const { error } = await supabase.from("generations").delete().eq("id", gen.id);
      if (error) throw error;
      setGenerations((prev) => prev.filter((g) => g.id !== gen.id));
      toast({ title: "Deleted", description: "Episode removed." });
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
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
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-display text-lg font-semibold">My Episodes</span>
          <Link to="/create" className="ml-auto">
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4" />
              New Episode
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        {generations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 space-y-4"
          >
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full gradient-bg">
              <Mic2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold">No episodes yet</h2>
            <p className="text-muted-foreground">Create your first AI-powered episode.</p>
            <Link to="/create">
              <Button variant="hero" className="rounded-full mt-4">
                <Plus className="h-4 w-4" />
                Create Episode
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold truncate">
                      {gen.title || "Untitled"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gen.voice_name} · {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {gen.text_input}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDelete(gen)}
                    disabled={deletingId === gen.id}
                  >
                    {deletingId === gen.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {gen.audio_url && (
                  <div className="flex gap-2">
                    <audio src={gen.audio_url} controls className="flex-1 h-10" />
                    <a href={gen.audio_url} download={`${gen.title || "episode"}.mp3`}>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
