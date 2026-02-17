import { motion } from "framer-motion";
import { Play, Square, Loader2, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voices } from "@/lib/voices";
import { useTTS } from "@/hooks/useTTS";

const VoiceShowcase = () => {
  const { play, playingVoiceId, loadingVoiceId } = useTTS();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">
            AI Voices
          </p>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl mb-4">
            Meet your <span className="gradient-text">podcast hosts</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose from a range of lifelike AI voices. Each one brings a unique character to your podcast.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {voices.map((voice, i) => {
            const isPlaying = playingVoiceId === voice.id;
            const isLoading = loadingVoiceId === voice.id;

            return (
              <motion.div
                key={voice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full gradient-bg">
                    <Mic2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm">{voice.name}</p>
                    <p className="text-xs text-muted-foreground">{voice.desc}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  "{voice.sampleText}"
                </p>
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs h-8 mt-auto"
                  onClick={() => play(voice.sampleText, voice.id, voice.elevenLabsId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : isPlaying ? (
                    <Square className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  {isLoading ? "Loading..." : isPlaying ? "Stop" : "Listen"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VoiceShowcase;
