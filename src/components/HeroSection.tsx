import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>
      <div className="absolute inset-0 hero-gradient" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Podcast Studio
          </motion.div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Create Stunning Podcasts{" "}
            <span className="gradient-text">in Minutes</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            From a simple prompt to a fully produced episode. AI writes your script, generates lifelike voices, and delivers studio-quality audio—ready to publish.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/create">
              <Button variant="hero" size="xl">
                Create Your First Episode
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="hero-outline" size="xl">
              <Play className="h-5 w-5" />
              Listen to a Sample
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-sm text-muted-foreground"
          >
            No credit card required · 3 free episodes per month
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
