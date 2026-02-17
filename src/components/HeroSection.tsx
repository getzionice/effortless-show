import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Headphones, AudioWaveform, Podcast } from "lucide-react";
import { motion } from "framer-motion";
import heroPerson from "@/assets/hero-person.png";

const podcastCards = [
{ title: "Morning Insights", host: "AI Generated", color: "bg-primary/10" },
{ title: "Tech Deep Dive", host: "AI Generated", color: "bg-accent/10" },
{ title: "Creative Hour", host: "AI Generated", color: "bg-secondary" }];


const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16 warm-gradient">
      <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start lg:pl-12">

            <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">
              AI-Powered Podcast Studio
            </p>

            <h1 className="mb-6 font-display text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-[4.2rem]">
              New era of
              <br />
              <span className="gradient-text">AI podcast</span>
              <br />
              creation
            </h1>

            <p className="mb-8 max-w-md text-base text-muted-foreground leading-relaxed">
              Podcraft creates studio-quality podcasts from a simple prompt. AI writes scripts, generates lifelike voices, and produces episodes end-to-end.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/create">
                <Button variant="hero" size="lg">
                  Start Creating
                  <Play className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-full">
                Library
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Partners */}
            <div className="mt-12">
              <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Publish to
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Podcast className="h-4 w-4" /> Spotify
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Headphones className="h-4 w-4" /> Apple Podcasts
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <AudioWaveform className="h-4 w-4" /> YouTube
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center">

            <img
              src={heroPerson}
              alt="Person listening to podcast"
              className="relative z-10 w-full max-w-md mx-auto" />


            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-8 right-4 lg:right-0 floating-badge flex items-center gap-2">

              <AudioWaveform className="h-4 w-4 text-primary" />
              <span className="text-foreground">Studio Quality</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-24 left-0 floating-badge flex items-center gap-2">

              <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-bg">
                <Play className="h-3 w-3 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">30m+</p>
                <p className="text-muted-foreground text-[10px]">Episodes created</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom podcast cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 grid gap-4 sm:grid-cols-3">

          {podcastCards.map((pod) =>
          <div
            key={pod.title}
            className="glass-card flex items-center gap-4 p-4">

              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${pod.color}`}>
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold truncate">{pod.title}</p>
                <p className="text-xs text-muted-foreground">{pod.host}</p>
              </div>
              <Button variant="default" size="sm" className="rounded-full text-xs h-8 px-4">
                Listen
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </section>);

};

export default HeroSection;