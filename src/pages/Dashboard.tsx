import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Trash2, Mic2, Plus, Loader2, Globe, GlobeLock, Rss } from "lucide-react";
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
  is_published: boolean;
}

const Dashboard = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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

  const handleTogglePublish = async (gen: Generation) => {
    setTogglingId(gen.id);
    try {
      const newVal = !gen.is_published;
      const { error } = await supabase
        .from("generations")
        .update({ is_published: newVal })
        .eq("id", gen.id);
      if (error) throw error;
      setGenerations((prev) =>
        prev.map((g) => (g.id === gen.id ? { ...g, is_published: newVal } : g))
      );
      toast({
        title: newVal ? "Published" : "Unpublished",
        description: newVal
          ? "Episode is now in your public RSS feed."
          : "Episode removed from public feed.",
      });
    } catch (error) {
      console.error("Toggle publish failed:", error);
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-rss`;

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
          <div className="ml-auto flex items-center gap-2">
            <a href={rssUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Rss className="h-4 w-4" />
                RSS Feed
              </Button>
            </a>
            <Link to="/create">
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" />
                New Episode
              </Button>
            </Link>
          </div>
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold truncate">
                        {gen.title || "Untitled"}
                      </h3>
                      {gen.is_published && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gen.voice_name} · {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {gen.text_input}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(gen)}
                      disabled={togglingId === gen.id || !gen.audio_url}
                      title={gen.is_published ? "Unpublish from feed" : "Publish to feed"}
                    >
                      {togglingId === gen.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : gen.is_published ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <GlobeLock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
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
