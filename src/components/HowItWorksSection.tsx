import { motion } from "framer-motion";
import { MessageSquareText, Cpu, Podcast } from "lucide-react";

const steps = [
  {
    icon: MessageSquareText,
    step: "01",
    title: "Describe Your Episode",
    description: "Enter your topic, preferred style, target audience, and episode length. That's all we need.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Does the Heavy Lifting",
    description: "Our engine writes a compelling script, selects voice profiles, and produces the full audio with music and effects.",
  },
  {
    icon: Podcast,
    step: "03",
    title: "Review & Publish",
    description: "Preview your episode, make any edits, and publish across all major platforms instantly.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-semibold tracking-tight">
            Three steps to your{" "}
            <span className="gradient-text">first episode</span>
          </h2>
          <p className="text-base text-muted-foreground">
            From idea to published podcast in under five minutes.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-primary/20">
                <s.icon className="h-9 w-9 text-primary-foreground" />
              </div>
              <span className="mb-2 block font-body text-xs font-bold tracking-widest text-primary uppercase">
                Step {s.step}
              </span>
              <h3 className="mb-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>

              {i < steps.length - 1 && (
                <div className="absolute right-0 top-10 hidden translate-x-1/2 md:block">
                  <div className="h-px w-16 gradient-bg opacity-30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
