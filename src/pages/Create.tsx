import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, Play, Download, Mic2, Pause, Wand2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { voices } from "@/lib/voices";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SCRIPT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

const Create = () => {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [writingScript, setWritingScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const selectedVoice = voices.find((v) => v.id === voiceId);

  const handleGenerateScript = useCallback(async () => {
    if (!scriptPrompt.trim()) return;
    setWritingScript(true);
    setText("");

    try {
      const resp = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic: scriptPrompt, style: "conversational and engaging", duration: 5 }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Script generation failed" }));
        throw new Error(err.error || `Failed: ${resp.status}`);
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullScript = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullScript += content;
              setText(fullScript);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (!title && scriptPrompt.length < 60) {
        setTitle(scriptPrompt);
      }
      toast({ title: "Script ready!", description: "Review and edit, then generate audio." });
    } catch (error) {
      console.error("Script generation failed:", error);
      toast({
        title: "Script generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWritingScript(false);
    }
  }, [scriptPrompt, title, toast]);

  const handleGenerate = async () => {
    if (!text || !voiceId) return;

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to generate audio.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setGenerating(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId: selectedVoice!.elevenLabsId }),
        }
      );

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const audioBlob = await response.blob();

      // Upload to storage
      const fileName = `${user.id}/${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("audio-generations")
        .upload(fileName, audioBlob, { contentType: "audio/mpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("audio-generations")
        .getPublicUrl(fileName);

      // Save generation record
      const { error: insertError } = await supabase.from("generations").insert({
        user_id: user.id,
        title: title || "Untitled",
        text_input: text,
        voice_id: voiceId,
        voice_name: selectedVoice!.name,
        audio_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;

      setAudioUrl(urlData.publicUrl);
      toast({ title: "Audio generated!", description: "Your episode is ready to play." });
    } catch (error) {
      console.error("Generation failed:", error);
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${title || "episode"}.mp3`;
    a.click();
  };

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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg">
              <Mic2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Create Episode</span>
          </div>
          {user && (
            <Link to="/dashboard" className="ml-auto">
              <Button variant="outline" size="sm">My Episodes</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Episode Title</label>
            <Input
              placeholder="e.g. The Future of AI in Healthcare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card border-border text-lg h-12"
            />
          </div>

          {/* AI Script Writer */}
          <div className="glass-card p-5 space-y-3 border-primary/10">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold">AI Script Writer</label>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your topic and AI will write a podcast-ready script for you.
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. The impact of AI on creative industries..."
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
                className="bg-card border-border"
                disabled={writingScript}
              />
              <Button
                variant="hero"
                size="sm"
                onClick={handleGenerateScript}
                disabled={!scriptPrompt.trim() || writingScript}
                className="shrink-0"
              >
                {writingScript ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {writingScript ? "Writing..." : "Write Script"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Your script or text <span className="text-primary">*</span>
            </label>
            <Textarea
              placeholder="Enter text manually or use the AI writer above..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-card border-border min-h-[160px] resize-none text-base"
            />
            <p className="text-xs text-muted-foreground">{text.length} / 5000 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Voice</label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="bg-card border-border h-12">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="font-medium">{v.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">— {v.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="w-full rounded-full"
            onClick={handleGenerate}
            disabled={!text || !voiceId || generating || text.length > 5000}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating audio...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Episode
              </>
            )}
          </Button>

          <AnimatePresence>
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6 space-y-4 border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {title || "Untitled Episode"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVoice?.name} · Ready to play
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
                    <Mic2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />

                <div className="flex gap-3">
                  <Button variant="hero" className="flex-1 rounded-full" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Create;
