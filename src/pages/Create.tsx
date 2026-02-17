import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Sparkles, Loader2, Play, Download, Mic2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const voices = [
  { id: "alex", name: "Alex", desc: "Warm, conversational male" },
  { id: "maya", name: "Maya", desc: "Energetic, professional female" },
  { id: "sam", name: "Sam", desc: "Calm, authoritative male" },
  { id: "zara", name: "Zara", desc: "Friendly, upbeat female" },
  { id: "duo", name: "Alex & Maya", desc: "Two-speaker dialogue" },
];

const Create = () => {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [voice, setVoice] = useState("");
  const [duration, setDuration] = useState([10]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!prompt) return;
    setGenerating(true);
    // Simulated generation
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
              <Mic2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Create Episode</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Episode Title</label>
            <Input
              placeholder="e.g. The Future of AI in Healthcare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50 border-border/50 text-lg h-12"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Describe your episode <span className="text-primary">*</span>
            </label>
            <Textarea
              placeholder="Tell us what your episode should be about. Include the topic, key points to cover, target audience, and any specific style or tone you'd like (e.g. educational, comedic, investigative)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-secondary/50 border-border/50 min-h-[160px] resize-none text-base"
            />
          </div>

          {/* Voice & Duration row */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Voice</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="bg-secondary/50 border-border/50 h-12">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Duration: ~{duration[0]} min
              </label>
              <div className="pt-3">
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={3}
                  max={60}
                  step={1}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleGenerate}
            disabled={!prompt || generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating your episode...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Episode
              </>
            )}
          </Button>

          {/* Result */}
          <AnimatePresence>
            {generated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card glow-border p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {title || "Untitled Episode"}
                    </h3>
                    <p className="text-sm text-muted-foreground">~{duration[0]} min · Ready to review</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg animate-pulse-glow">
                    <Mic2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Fake waveform */}
                <div className="flex items-center gap-[2px] h-16 px-2">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full gradient-bg opacity-60"
                      style={{
                        height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="hero" className="flex-1">
                    <Play className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" className="flex-1">
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
