import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Trash2, Mic2, Plus, Loader2,
  Globe, GlobeLock, Rss, Heart, ListMusic, Search, X, Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnalyticsSection from "@/components/AnalyticsSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Generation {
  id: string;
  title: string | null;
  text_input: string;
  voice_name: string;
  audio_url: string | null;
  created_at: string;
  is_published: boolean;
  tags: string[];
  duration_seconds: number | null;
}

interface Playlist {
  id: string;
  name: string;
}

const PRESET_TAGS = [
  "Interview", "News", "Tutorial", "Story", "Comedy",
  "Technology", "Business", "Health", "Science", "Education",
  "Entertainment", "Sports", "Politics", "Culture", "Music",
];

const Dashboard = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  // Tag editing
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
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
    const { data } = await supabase.from("favorites").select("generation_id");
    if (data) setFavoriteIds(new Set(data.map((f: any) => f.generation_id)));
  };

  const fetchPlaylists = async () => {
    const { data } = await supabase.from("playlists").select("id, name").order("created_at", { ascending: false });
    if (data) setPlaylists(data);
  };

  // Derived data
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    generations.forEach((g) => g.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [generations]);

  const allVoices = useMemo(() => {
    const voiceSet = new Set<string>();
    generations.forEach((g) => voiceSet.add(g.voice_name));
    return Array.from(voiceSet).sort();
  }, [generations]);

  const displayed = useMemo(() => {
    let result = generations;

    if (filter === "favorites") {
      result = result.filter((g) => favoriteIds.has(g.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          (g.title || "").toLowerCase().includes(q) ||
          g.text_input.toLowerCase().includes(q) ||
          g.voice_name.toLowerCase().includes(q) ||
          g.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((g) =>
        selectedTags.every((tag) => g.tags?.includes(tag))
      );
    }

    if (selectedVoice) {
      result = result.filter((g) => g.voice_name === selectedVoice);
    }

    return result;
  }, [generations, filter, searchQuery, selectedTags, selectedVoice, favoriteIds]);

  // Actions
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
      .from("playlist_items").select("position").eq("playlist_id", playlistId)
      .order("position", { ascending: false }).limit(1);
    const nextPos = items && items.length > 0 ? (items[0] as any).position + 1 : 0;
    const { error } = await supabase
      .from("playlist_items").insert({ playlist_id: playlistId, generation_id: genId, position: nextPos });
    if (error) {
      toast({ title: error.code === "23505" ? "Already in playlist" : "Failed to add", variant: error.code === "23505" ? "default" : "destructive" });
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
      toast({ title: "Deleted" });
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

  const handleAddTag = async (genId: string, tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const gen = generations.find((g) => g.id === genId);
    if (!gen || gen.tags?.includes(trimmed)) return;
    const newTags = [...(gen.tags || []), trimmed];
    const { error } = await supabase.from("generations").update({ tags: newTags }).eq("id", genId);
    if (!error) {
      setGenerations((prev) => prev.map((g) => (g.id === genId ? { ...g, tags: newTags } : g)));
    }
    setNewTag("");
  };

  const handleRemoveTag = async (genId: string, tag: string) => {
    const gen = generations.find((g) => g.id === genId);
    if (!gen) return;
    const newTags = gen.tags.filter((t) => t !== tag);
    const { error } = await supabase.from("generations").update({ tags: newTags }).eq("id", genId);
    if (!error) {
      setGenerations((prev) => prev.map((g) => (g.id === genId ? { ...g, tags: newTags } : g)));
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedVoice;
  const clearFilters = () => { setSearchQuery(""); setSelectedTags([]); setSelectedVoice(""); };

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
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          <span className="font-display text-lg font-semibold">Dashboard</span>
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

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Analytics Section */}
        <AnalyticsSection generations={generations} />

        {/* My Episodes */}
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-primary" /> My Episodes
        </h2>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search episodes by title, content, voice, or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 rounded-xl bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab filters */}
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm" onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All ({generations.length})
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm" onClick={() => setFilter("favorites")}
            className="rounded-full gap-1.5"
          >
            <Heart className="h-3.5 w-3.5" /> Favorites ({favoriteIds.size})
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Voice filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedVoice ? "default" : "outline"} size="sm" className="rounded-full gap-1.5">
                <Mic2 className="h-3.5 w-3.5" />
                {selectedVoice || "Voice"}
                {selectedVoice && (
                  <X className="h-3 w-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setSelectedVoice(""); }} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by voice</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allVoices.map((v) => (
                <DropdownMenuItem key={v} onClick={() => setSelectedVoice(v === selectedVoice ? "" : v)}>
                  {v}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tag filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={selectedTags.length > 0 ? "default" : "outline"} size="sm" className="rounded-full gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Filter by tags</p>
              {allTags.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No tags yet. Add tags to your episodes below.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleTagFilter(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={() => setSelectedTags([])}>
                  Clear tags
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Results count when filtering */}
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            {displayed.length} {displayed.length === 1 ? "episode" : "episodes"} found
          </p>
        )}

        {/* Episodes list */}
        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full gradient-bg">
              {hasActiveFilters ? <Search className="h-8 w-8 text-primary-foreground" /> : filter === "favorites" ? <Heart className="h-8 w-8 text-primary-foreground" /> : <Mic2 className="h-8 w-8 text-primary-foreground" />}
            </div>
            <h2 className="font-display text-2xl font-semibold">
              {hasActiveFilters ? "No matches" : filter === "favorites" ? "No favorites yet" : "No episodes yet"}
            </h2>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : filter === "favorites"
                ? "Heart an episode to add it here."
                : "Create your first AI-powered episode."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="rounded-full mt-2" onClick={clearFilters}>Clear filters</Button>
            )}
            {!hasActiveFilters && filter === "all" && (
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
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      {gen.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10 group"
                          onClick={() => {
                            if (editingTagsId === gen.id) {
                              handleRemoveTag(gen.id, tag);
                            } else {
                              toggleTagFilter(tag);
                            }
                          }}
                        >
                          {tag}
                          {editingTagsId === gen.id && (
                            <X className="h-2.5 w-2.5 text-muted-foreground group-hover:text-destructive" />
                          )}
                        </Badge>
                      ))}
                      {editingTagsId === gen.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { handleAddTag(gen.id, newTag); }
                              if (e.key === "Escape") { setEditingTagsId(null); setNewTag(""); }
                            }}
                            placeholder="Add tag…"
                            className="h-6 w-24 text-xs px-2 rounded-md"
                            autoFocus
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">Quick add</p>
                              <div className="flex flex-wrap gap-1">
                                {PRESET_TAGS.filter((t) => !gen.tags?.includes(t)).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-[10px] cursor-pointer hover:bg-primary/10"
                                    onClick={() => handleAddTag(gen.id, tag)}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => { setEditingTagsId(null); setNewTag(""); }}>
                            Done
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingTagsId(gen.id)}
                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Tag className="h-3 w-3" />
                          {(gen.tags?.length || 0) === 0 ? "Add tags" : "Edit"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(gen.id)}
                      title={favoriteIds.has(gen.id) ? "Remove from favorites" : "Add to favorites"}>
                      <Heart className={`h-4 w-4 transition-colors ${favoriteIds.has(gen.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
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
                    <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(gen)}
                      disabled={togglingId === gen.id || !gen.audio_url}
                      title={gen.is_published ? "Unpublish" : "Publish"}>
                      {togglingId === gen.id ? <Loader2 className="h-4 w-4 animate-spin" /> : gen.is_published ? <Globe className="h-4 w-4 text-primary" /> : <GlobeLock className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(gen)} disabled={deletingId === gen.id}>
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
