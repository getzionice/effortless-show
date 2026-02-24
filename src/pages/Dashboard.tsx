import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, Trash2, Mic2, Plus, Loader2,
  Globe, GlobeLock, Rss, Heart, ListMusic,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Generation {
  id: string;
  title: string | null;
  text_input: string;
  voice_name: string;
  audio_url: string | null;
  created_at: string;
  is_published: boolean;
}

interface Playlist {
  id: string;
  name: string;
}

const Dashboard = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchGenerations();
      fetchFavorites();
      fetchPlaylists();
    }
  }, [user, authLoading]);

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setGenerations(data || []);
    setLoading(false);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("generation_id");
    if (data) setFavoriteIds(new Set(data.map((f: any) => f.generation_id)));
  };

  const fetchPlaylists = async () => {
    const { data } = await supabase
      .from("playlists")
      .select("id, name")
      .order("created_at", { ascending: false });
    if (data) setPlaylists(data);
  };

  const handleToggleFavorite = useCallback(async (genId: string) => {
    const isFav = favoriteIds.has(genId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("generation_id", genId).eq("user_id", user!.id);
      setFavoriteIds((prev) => { const s = new Set(prev); s.delete(genId); return s; });
      toast({ title: "Removed from favorites" });
    } else {
      await supabase.from("favorites").insert({ user_id: user!.id, generation_id: genId });
      setFavoriteIds((prev) => new Set(prev).add(genId));
      toast({ title: "Added to favorites" });
    }
  }, [favoriteIds, user]);

  const handleAddToPlaylist = async (playlistId: string, genId: string) => {
    const { data: items } = await supabase
      .from("playlist_items")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = items && items.length > 0 ? (items[0] as any).position + 1 : 0;
    const { error } = await supabase
      .from("playlist_items")
      .insert({ playlist_id: playlistId, generation_id: genId, position: nextPos });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already in playlist" });
      } else {
        toast({ title: "Failed to add", variant: "destructive" });
      }
    } else {
      toast({ title: "Added to playlist" });
    }
  };

  const handleDelete = async (gen: Generation) => {
    setDeletingId(gen.id);
    try {
      if (gen.audio_url) {
        const path = gen.audio_url.split("/audio-generations/")[1];
        if (path) await supabase.storage.from("audio-generations").remove([path]);
      }
      const { error } = await supabase.from("generations").delete().eq("id", gen.id);
      if (error) throw error;
      setGenerations((prev) => prev.filter((g) => g.id !== gen.id));
      toast({ title: "Deleted", description: "Episode removed." });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (gen: Generation) => {
    setTogglingId(gen.id);
    try {
      const newVal = !gen.is_published;
      const { error } = await supabase.from("generations").update({ is_published: newVal }).eq("id", gen.id);
      if (error) throw error;
      setGenerations((prev) => prev.map((g) => (g.id === gen.id ? { ...g, is_published: newVal } : g)));
      toast({ title: newVal ? "Published" : "Unpublished" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-rss`;
  const displayed = filter === "favorites"
    ? generations.filter((g) => favoriteIds.has(g.id))
    : generations;

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
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <span className="font-display text-lg font-semibold">My Episodes</span>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/playlists">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ListMusic className="h-4 w-4" /> Playlists
              </Button>
            </Link>
            <a href={rssUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Rss className="h-4 w-4" /> RSS
              </Button>
            </a>
            <Link to="/create">
              <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> New Episode</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All ({generations.length})
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("favorites")}
            className="rounded-full gap-1.5"
          >
            <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteIds.size})
          </Button>
        </div>

        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full gradient-bg">
              {filter === "favorites" ? <Heart className="h-8 w-8 text-primary-foreground" /> : <Mic2 className="h-8 w-8 text-primary-foreground" />}
            </div>
            <h2 className="font-display text-2xl font-semibold">
              {filter === "favorites" ? "No favorites yet" : "No episodes yet"}
            </h2>
            <p className="text-muted-foreground">
              {filter === "favorites" ? "Heart an episode to add it here." : "Create your first AI-powered episode."}
            </p>
            {filter === "all" && (
              <Link to="/create">
                <Button variant="hero" className="rounded-full mt-4"><Plus className="h-4 w-4" /> Create Episode</Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayed.map((gen, i) => (
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
                      <h3 className="font-display font-semibold truncate">{gen.title || "Untitled"}</h3>
                      {gen.is_published && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gen.voice_name} · {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{gen.text_input}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(gen.id)}
                      title={favoriteIds.has(gen.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          favoriteIds.has(gen.id)
                            ? "fill-destructive text-destructive"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    {playlists.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" title="Add to playlist">
                            <ListMusic className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {playlists.map((pl) => (
                            <DropdownMenuItem key={pl.id} onClick={() => handleAddToPlaylist(pl.id, gen.id)}>
                              {pl.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleTogglePublish(gen)}
                      disabled={togglingId === gen.id || !gen.audio_url}
                      title={gen.is_published ? "Unpublish" : "Publish"}
                    >
                      {togglingId === gen.id ? <Loader2 className="h-4 w-4 animate-spin" /> : gen.is_published ? <Globe className="h-4 w-4 text-primary" /> : <GlobeLock className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(gen)}
                      disabled={deletingId === gen.id}
                    >
                      {deletingId === gen.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {gen.audio_url && (
                  <div className="flex gap-2">
                    <audio src={gen.audio_url} controls className="flex-1 h-10" />
                    <a href={gen.audio_url} download={`${gen.title || "episode"}.mp3`}>
                      <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
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
