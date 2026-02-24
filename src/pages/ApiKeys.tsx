import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Copy, Key, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "pk_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchKeys();
  }, [user, authLoading]);

  const fetchKeys = async () => {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setKeys(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const rawKey = generateApiKey();
      const hash = await hashKey(rawKey);
      const prefix = rawKey.substring(0, 7) + "...";

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: newKeyName || "Default",
        key_prefix: prefix,
        key_hash: hash,
      });

      if (error) throw error;

      setShowNewKey(rawKey);
      setNewKeyName("");
      fetchKeys();
      toast({ title: "API key created!", description: "Copy it now — you won't see it again." });
    } catch (error) {
      console.error("Create key failed:", error);
      toast({ title: "Failed to create key", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (!error) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key deleted" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: !isActive })
      .eq("id", id);
    if (!error) {
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: !isActive } : k))
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
          <span className="font-display text-lg font-semibold">API Keys</span>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-12 space-y-8">
        {/* API usage docs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-3"
        >
          <h3 className="font-display text-lg font-semibold">Use the API</h3>
          <p className="text-sm text-muted-foreground">
            Generate audio programmatically by sending a POST request:
          </p>
          <div className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
            <pre>{`curl -X POST \\
  ${window.location.origin}/functions/v1/tts-api \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello world", "voiceId": "roger"}'`}</pre>
          </div>
        </motion.div>

        {/* Create new key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-4"
        >
          <h3 className="font-display text-lg font-semibold">Create New Key</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Key name (e.g. Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-card border-border"
            />
            <Button variant="hero" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </div>

          {showNewKey && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-primary">
                ⚠️ Copy this key now — you won't see it again!
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded flex-1 overflow-x-auto">
                  {showNewKey}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(showNewKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowNewKey(null)}
              >
                I've copied it
              </Button>
            </div>
          )}
        </motion.div>

        {/* Key list */}
        <div className="space-y-3">
          {keys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <Key className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{key.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(key.id, key.is_active)}
              >
                {key.is_active ? (
                  <Eye className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(key.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}

          {keys.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No API keys yet. Create one above.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;
