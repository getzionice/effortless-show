import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Sparkles, Loader2, Play, Download, Mic2, Pause, Wand2,
  Plus, Trash2, GripVertical, Users, User, LayoutTemplate,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { voices, Voice } from "@/lib/voices";
import { templates, templateCategories, EpisodeTemplate } from "@/lib/templates";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SCRIPT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

interface DialogueSegment {
  id: string;
  voiceId: string;
  text: string;
}

function newSegment(voiceId = ""): DialogueSegment {
  return { id: crypto.randomUUID(), voiceId, text: "" };
}

const Create = () => {
  // Shared state
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Single-voice state
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [writingScript, setWritingScript] = useState(false);

  // Multi-voice state
  const [segments, setSegments] = useState<DialogueSegment[]>([
    newSegment(voices[0]?.id),
    newSegment(voices[1]?.id),
  ]);
  const [dialoguePrompt, setDialoguePrompt] = useState("");
  const [writingDialogue, setWritingDialogue] = useState(false);

  // Template state
  const [templateCategory, setTemplateCategory] = useState<string>("all");

  const applyTemplate = useCallback((template: EpisodeTemplate) => {
    setTitle("");
    setAudioUrl(null);
    setMode(template.mode);
    if (template.mode === "single") {
      setText(template.script || "");
      setVoiceId(template.suggestedVoices[0] || "");
      setScriptPrompt(template.scriptPrompt || "");
    } else {
      if (template.segments) {
        setSegments(template.segments.map((s) => ({ id: crypto.randomUUID(), ...s })));
      }
      setDialoguePrompt(template.dialoguePrompt || "");
    }
    toast({ title: `Template loaded: ${template.name}`, description: "Customize it and generate!" });
  }, [toast]);

  const selectedVoice = voices.find((v) => v.id === voiceId);
  const filteredTemplates = templateCategory === "all"
    ? templates
    : templates.filter((t) => t.category === templateCategory);


  // ── AI Script Writer (single voice) ──
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

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
            if (content) { fullScript += content; setText(fullScript); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      if (!title && scriptPrompt.length < 60) setTitle(scriptPrompt);
      toast({ title: "Script ready!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Script generation failed", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally {
      setWritingScript(false);
    }
  }, [scriptPrompt, title, toast]);

  // ── AI Dialogue Writer (multi voice) ──
  const handleGenerateDialogue = useCallback(async () => {
    if (!dialoguePrompt.trim()) return;
    setWritingDialogue(true);

    // Pick the voices assigned to existing segments, or default first 2
    const usedVoices = segments
      .map((s) => voices.find((v) => v.id === s.voiceId))
      .filter(Boolean) as Voice[];
    const uniqueVoices = [...new Map(usedVoices.map((v) => [v.id, v])).values()];
    if (uniqueVoices.length < 2) {
      uniqueVoices.push(...voices.filter((v) => !uniqueVoices.find((u) => u.id === v.id)).slice(0, 2 - uniqueVoices.length));
    }
    const voiceNames = uniqueVoices.map((v) => v.name);

    try {
      const resp = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topic: dialoguePrompt,
          style: `A natural conversation/dialogue between ${voiceNames.join(" and ")}. Format each line as "NAME: dialogue text" where NAME is one of: ${voiceNames.join(", ")}. Do NOT include any other text.`,
          duration: 5,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Dialogue generation failed" }));
        throw new Error(err.error || `Failed: ${resp.status}`);
      }
      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      // Parse "NAME: text" lines into segments
      const lines = fullText.split("\n").filter((l) => l.trim());
      const newSegments: DialogueSegment[] = [];
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)/);
        if (match) {
          const speakerName = match[1];
          const dialogueText = match[2].trim();
          const voice = uniqueVoices.find((v) => v.name.toLowerCase() === speakerName.toLowerCase());
          newSegments.push({
            id: crypto.randomUUID(),
            voiceId: voice?.id || uniqueVoices[0].id,
            text: dialogueText,
          });
        }
      }

      if (newSegments.length > 0) {
        setSegments(newSegments);
        if (!title && dialoguePrompt.length < 60) setTitle(dialoguePrompt);
        toast({ title: "Dialogue ready!", description: `${newSegments.length} segments created.` });
      } else {
        toast({ title: "Could not parse dialogue", description: "Try writing segments manually.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Dialogue generation failed", variant: "destructive" });
    } finally {
      setWritingDialogue(false);
    }
  }, [dialoguePrompt, segments, title, toast]);

  // ── Segment management ──
  const updateSegment = (id: string, field: keyof DialogueSegment, value: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };
  const addSegment = () => setSegments((prev) => [...prev, newSegment(prev[prev.length - 1]?.voiceId || voices[0]?.id)]);
  const removeSegment = (id: string) => setSegments((prev) => prev.filter((s) => s.id !== id));

  // ── Generate audio ──
  const generateTTSBlob = async (inputText: string, elevenLabsVoiceId: string): Promise<Blob> => {
    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text: inputText, voiceId: elevenLabsVoiceId }),
    });
    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
    return response.blob();
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to generate audio.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (mode === "single" && (!text || !voiceId)) return;
    if (mode === "multi" && segments.filter((s) => s.text.trim() && s.voiceId).length === 0) return;

    setGenerating(true);
    setAudioUrl(null);

    try {
      let finalBlob: Blob;
      let voiceNameForRecord: string;

      if (mode === "single") {
        setGenerationProgress("Generating audio...");
        finalBlob = await generateTTSBlob(text, selectedVoice!.elevenLabsId);
        voiceNameForRecord = selectedVoice!.name;
      } else {
        // Multi-voice: generate each segment and concatenate MP3 blobs
        const validSegments = segments.filter((s) => s.text.trim() && s.voiceId);
        const blobs: Blob[] = [];

        for (let i = 0; i < validSegments.length; i++) {
          const seg = validSegments[i];
          const voice = voices.find((v) => v.id === seg.voiceId)!;
          setGenerationProgress(`Generating segment ${i + 1} of ${validSegments.length} (${voice.name})...`);
          const blob = await generateTTSBlob(seg.text, voice.elevenLabsId);
          blobs.push(blob);
        }

        // Concatenate MP3 blobs (MP3 frames are self-contained, concatenation works)
        finalBlob = new Blob(blobs, { type: "audio/mpeg" });
        const voiceNames = [...new Set(validSegments.map((s) => voices.find((v) => v.id === s.voiceId)?.name).filter(Boolean))];
        voiceNameForRecord = voiceNames.join(" & ");
      }

      setGenerationProgress("Uploading...");

      const fileName = `${user.id}/${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("audio-generations")
        .upload(fileName, finalBlob, { contentType: "audio/mpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("audio-generations")
        .getPublicUrl(fileName);

      const textForRecord = mode === "single" ? text : segments.map((s) => {
        const v = voices.find((v) => v.id === s.voiceId);
        return `${v?.name || "?"}: ${s.text}`;
      }).join("\n");

      const { error: insertError } = await supabase.from("generations").insert({
        user_id: user.id,
        title: title || "Untitled",
        text_input: textForRecord,
        voice_id: mode === "single" ? voiceId : "multi",
        voice_name: voiceNameForRecord,
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
      setGenerationProgress("");
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${title || "episode"}.mp3`;
    a.click();
  };

  const canGenerate = mode === "single"
    ? text.trim() && voiceId && !generating && text.length <= 5000
    : segments.some((s) => s.text.trim() && s.voiceId) && !generating;

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
          {/* Template Library */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold">Start from a Template</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {templateCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={templateCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setTemplateCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-4 text-left hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{template.category}</span>
                        {template.mode === "multi" && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Multi-voice
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground">or start from scratch</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Episode Title</label>
            <Input
              placeholder="e.g. The Future of AI in Healthcare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card border-border text-lg h-12"
            />
          </div>

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "multi")}>
            <TabsList className="w-full">
              <TabsTrigger value="single" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Single Voice
              </TabsTrigger>
              <TabsTrigger value="multi" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                Multi-Voice Conversation
              </TabsTrigger>
            </TabsList>

            {/* ── Single Voice ── */}
            <TabsContent value="single" className="space-y-6 mt-6">
              {/* AI Script Writer */}
              <div className="glass-card p-5 space-y-3 border-primary/10">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold">AI Script Writer</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe your topic and AI will write a podcast-ready script.
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
                    {writingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
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
            </TabsContent>

            {/* ── Multi-Voice Conversation ── */}
            <TabsContent value="multi" className="space-y-6 mt-6">
              {/* AI Dialogue Writer */}
              <div className="glass-card p-5 space-y-3 border-primary/10">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold">AI Dialogue Writer</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe a topic and AI will write a conversation between your chosen voices.
                </p>
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g. Debate about whether AI will replace human creativity..."
                    value={dialoguePrompt}
                    onChange={(e) => setDialoguePrompt(e.target.value)}
                    className="bg-card border-border"
                    disabled={writingDialogue}
                  />
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleGenerateDialogue}
                    disabled={!dialoguePrompt.trim() || writingDialogue}
                    className="shrink-0"
                  >
                    {writingDialogue ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {writingDialogue ? "Writing..." : "Write Dialogue"}
                  </Button>
                </div>
              </div>

              {/* Dialogue segments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Dialogue Segments
                  </label>
                  <Button variant="outline" size="sm" onClick={addSegment}>
                    <Plus className="h-4 w-4" />
                    Add Segment
                  </Button>
                </div>

                {segments.map((seg, i) => {
                  const segVoice = voices.find((v) => v.id === seg.voiceId);
                  return (
                    <motion.div
                      key={seg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground w-6">#{i + 1}</span>
                        <Select
                          value={seg.voiceId}
                          onValueChange={(v) => updateSegment(seg.id, "voiceId", v)}
                        >
                          <SelectTrigger className="bg-card border-border h-9 w-48">
                            <SelectValue placeholder="Voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voices.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {segVoice && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-bg shrink-0">
                            <Mic2 className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex-1" />
                        {segments.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeSegment(seg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={`What does ${segVoice?.name || "this voice"} say?`}
                        value={seg.text}
                        onChange={(e) => updateSegment(seg.id, "text", e.target.value)}
                        className="bg-card border-border min-h-[80px] resize-none text-sm"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Generate button */}
          <Button
            variant="hero"
            size="xl"
            className="w-full rounded-full"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {generationProgress || "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {mode === "multi" ? "Generate Conversation" : "Generate Episode"}
              </>
            )}
          </Button>

          {/* Audio result */}
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
                      {mode === "multi"
                        ? `${[...new Set(segments.map((s) => voices.find((v) => v.id === s.voiceId)?.name).filter(Boolean))].join(" & ")} · Conversation`
                        : `${selectedVoice?.name} · Monologue`}
                      {" "}· Ready to play
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
                    {mode === "multi" ? (
                      <Users className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Mic2 className="h-6 w-6 text-primary-foreground" />
                    )}
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
