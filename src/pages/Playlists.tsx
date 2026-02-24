import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Plus, Loader2, ListMusic, Trash2, Play, X, Music, GripVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  item_count?: number;
}

interface PlaylistItem {
  id: string;
  position: number;
  generation: {
    id: string;
    title: string | null;
    voice_name: string;
    audio_url: string | null;
    created_at: string;
  };
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchPlaylists();
  }, [user, authLoading]);

  const fetchPlaylists = async () => {
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Get item counts
      const withCounts = await Promise.all(
        data.map(async (pl: any) => {
          const { count } = await supabase
            .from("playlist_items")
            .select("id", { count: "exact", head: true })
            .eq("playlist_id", pl.id);
          return { ...pl, item_count: count || 0 };
        })
      );
      setPlaylists(withCounts);
    }
    setLoading(false);
  };

  const fetchItems = async (playlistId: string) => {
    setItemsLoading(true);
    const { data } = await supabase
      .from("playlist_items")
      .select("id, position, generation_id")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (data && data.length > 0) {
      const genIds = data.map((d: any) => d.generation_id);
      const { data: gens } = await supabase
        .from("generations")
        .select("id, title, voice_name, audio_url, created_at")
        .in("id", genIds);

      const genMap = new Map((gens || []).map((g: any) => [g.id, g]));
      const merged = data
        .map((item: any) => ({
          id: item.id,
          position: item.position,
          generation: genMap.get(item.generation_id),
        }))
        .filter((item: any) => item.generation);
      setItems(merged);
    } else {
      setItems([]);
    }
    setItemsLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { error } = await supabase
      .from("playlists")
      .insert({ user_id: user!.id, name: newName.trim() });
    if (error) {
      toast({ title: "Failed to create playlist", variant: "destructive" });
    } else {
      toast({ title: "Playlist created" });
      setNewName("");
      setShowCreate(false);
      fetchPlaylists();
    }
    setCreating(false);
  };

  const handleDeletePlaylist = async (id: string) => {
    setDeletingPlaylist(id);
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (!error) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlaylist?.id === id) { setSelectedPlaylist(null); setItems([]); }
      toast({ title: "Playlist deleted" });
    }
    setDeletingPlaylist(null);
  };

  const handleRemoveItem = async (itemId: string) => {
    await supabase.from("playlist_items").delete().eq("id", itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    toast({ title: "Removed from playlist" });
  };

  const openPlaylist = (pl: Playlist) => {
    setSelectedPlaylist(pl);
    fetchItems(pl.id);
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
          <Link to="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Dashboard</Button>
          </Link>
          <span className="font-display text-lg font-semibold">Playlists</span>
          <Button variant="hero" size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Playlist
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {/* Playlist List */}
        {!selectedPlaylist ? (
          playlists.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full gradient-bg">
                <ListMusic className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-semibold">No playlists yet</h2>
              <p className="text-muted-foreground">Create a playlist to organize your episodes.</p>
              <Button variant="hero" className="rounded-full mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create Playlist
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {playlists.map((pl, i) => (
                <motion.div
                  key={pl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => openPlaylist(pl)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-bg">
                      <ListMusic className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold truncate">{pl.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {pl.item_count} {pl.item_count === 1 ? "episode" : "episodes"} · {new Date(pl.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl.id); }}
                    disabled={deletingPlaylist === pl.id}
                  >
                    {deletingPlaylist === pl.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Playlist Detail */
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedPlaylist(null); setItems([]); }}>
              <ArrowLeft className="h-4 w-4" /> All Playlists
            </Button>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl gradient-bg">
                <ListMusic className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{selectedPlaylist.name}</h2>
                <p className="text-sm text-muted-foreground">{items.length} episodes</p>
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Music className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">No episodes in this playlist yet.</p>
                <p className="text-xs text-muted-foreground">Add episodes from your dashboard.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4 flex items-center gap-4"
                  >
                    <span className="text-xs text-muted-foreground font-mono w-6 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.generation.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{item.generation.voice_name}</p>
                    </div>
                    {item.generation.audio_url && (
                      <audio src={item.generation.audio_url} controls className="h-8 w-48 shrink-0" />
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Playlist</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Playlists;
