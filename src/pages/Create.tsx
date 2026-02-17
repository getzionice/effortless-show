import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Sparkles, Loader2, Play, Download, Mic2, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { voices } from "@/lib/voices";
import { useTTS } from "@/hooks/useTTS";

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
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 4000);
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Describe your episode <span className="text-primary">*</span>
            </label>
            <Textarea
              placeholder="Tell us what your episode should be about. Include the topic, key points to cover, target audience, and any specific style or tone you'd like..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-card border-border min-h-[160px] resize-none text-base"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Voice</label>
              <Select value={voice} onValueChange={setVoice}>
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

          <Button
            variant="hero"
            size="xl"
            className="w-full rounded-full"
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

          <AnimatePresence>
            {generated && (
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
                    <p className="text-sm text-muted-foreground">~{duration[0]} min · Ready to review</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
                    <Mic2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                <div className="flex items-center gap-[2px] h-16 px-2">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full gradient-bg opacity-50"
                      style={{
                        height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="hero" className="flex-1 rounded-full">
                    <Play className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full">
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
