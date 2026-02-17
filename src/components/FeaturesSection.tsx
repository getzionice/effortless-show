import { Wand2, AudioWaveform, Users, Zap, Globe, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Wand2,
    title: "AI Script Writing",
    description: "Provide a topic and tone—our AI crafts an engaging, structured script tailored for audio.",
  },
  {
    icon: AudioWaveform,
    title: "Lifelike Voice Generation",
    description: "Choose from dozens of ultra-realistic AI voices or clone your own for a personal touch.",
  },
  {
    icon: Users,
    title: "Multi-Speaker Dialogues",
    description: "Create interview-style or panel podcasts with distinct AI voices for each speaker.",
  },
  {
    icon: Zap,
    title: "One-Click Production",
    description: "Intro music, transitions, sound effects—all mixed and mastered automatically.",
  },
  {
    icon: Globe,
    title: "Publish Everywhere",
    description: "Distribute to Spotify, Apple Podcasts, YouTube, and more with a single click.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track downloads, listener engagement, and growth metrics in real time.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold">
            Everything You Need to{" "}
            <span className="gradient-text">Launch a Podcast</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional tools powered by AI, designed for creators who want results—not complexity.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 group hover:glow-border transition-all duration-500"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
