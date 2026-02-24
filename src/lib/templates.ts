import { Voice } from "./voices";

export interface EpisodeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: "single" | "multi";
  /** For single-voice templates */
  scriptPrompt?: string;
  /** For multi-voice templates */
  dialoguePrompt?: string;
  /** Suggested voice IDs */
  suggestedVoices: string[];
  /** Pre-filled segments for multi-voice */
  segments?: { voiceId: string; text: string }[];
  /** Pre-filled script for single-voice */
  script?: string;
  category: "interview" | "monologue" | "news" | "storytelling" | "educational" | "debate";
}

export const templates: EpisodeTemplate[] = [
  // ── Monologues ──
  {
    id: "daily-briefing",
    name: "Daily News Briefing",
    description: "A concise, professional news update covering today's top stories.",
    icon: "📰",
    mode: "single",
    category: "news",
    suggestedVoices: ["george", "sarah"],
    script: "Good morning, and welcome to your daily briefing. Here are the top stories you need to know today...\n\n[Add your news stories here]\n\nThat's your briefing for today. Stay informed, and we'll see you tomorrow.",
    scriptPrompt: "A 3-minute daily news briefing covering tech, business, and world events",
  },
  {
    id: "meditation",
    name: "Guided Meditation",
    description: "A calming guided meditation for relaxation and mindfulness.",
    icon: "🧘",
    mode: "single",
    category: "monologue",
    suggestedVoices: ["lily", "brian"],
    script: "Welcome... Find a comfortable position, and gently close your eyes... Take a deep breath in... and slowly let it out...\n\nNotice the weight of your body... the feeling of stillness around you...\n\n[Continue your meditation script here]\n\nWhen you're ready... slowly open your eyes... and carry this calm with you.",
  },
  {
    id: "product-review",
    name: "Product Review",
    description: "An honest, detailed review of a product or service.",
    icon: "⭐",
    mode: "single",
    category: "monologue",
    suggestedVoices: ["roger", "jessica"],
    scriptPrompt: "An honest and engaging product review covering pros, cons, and final verdict",
    script: "Hey everyone, today I'm reviewing something I've been using for the past few weeks, and I have a lot of thoughts...\n\n[Describe the product here]\n\nSo, should you buy it? Let me break it down...",
  },
  {
    id: "storytelling",
    name: "Short Story Narration",
    description: "A dramatic narration perfect for fiction and creative storytelling.",
    icon: "📖",
    mode: "single",
    category: "storytelling",
    suggestedVoices: ["brian", "george"],
    scriptPrompt: "A gripping short story opening with vivid imagery and suspense",
    script: "It was the kind of night that made you question everything you thought you knew...\n\n[Continue your story here]\n\nAnd as the sun rose, nothing would ever be the same again.",
  },
  {
    id: "tutorial",
    name: "How-To Tutorial",
    description: "A clear, step-by-step educational walkthrough.",
    icon: "🎓",
    mode: "single",
    category: "educational",
    suggestedVoices: ["sarah", "roger"],
    scriptPrompt: "A clear, beginner-friendly tutorial with step-by-step instructions",
    script: "Welcome to today's tutorial. By the end of this episode, you'll know exactly how to...\n\nStep one...\n\n[Add your tutorial steps here]\n\nAnd that's it! You've just learned how to... If you found this helpful, make sure to share it.",
  },

  // ── Multi-voice ──
  {
    id: "interview",
    name: "Interview / Q&A",
    description: "A host interviews a guest with engaging back-and-forth dialogue.",
    icon: "🎙️",
    mode: "multi",
    category: "interview",
    suggestedVoices: ["roger", "sarah"],
    dialoguePrompt: "An engaging interview between a host and guest about their career journey and insights",
    segments: [
      { voiceId: "roger", text: "Welcome to the show! I'm so excited to have you here today. Tell us a bit about yourself." },
      { voiceId: "sarah", text: "Thanks for having me! Well, it's been quite a journey. I started out in a completely different field..." },
      { voiceId: "roger", text: "That's fascinating. What made you decide to make that switch?" },
      { voiceId: "sarah", text: "Honestly, it was a moment of clarity. I realized I was spending all my free time doing this, so why not make it my career?" },
    ],
  },
  {
    id: "debate",
    name: "Point / Counterpoint Debate",
    description: "Two voices present opposing viewpoints on a topic.",
    icon: "⚖️",
    mode: "multi",
    category: "debate",
    suggestedVoices: ["george", "jessica"],
    dialoguePrompt: "A respectful but passionate debate about whether remote work is better than office work",
    segments: [
      { voiceId: "george", text: "I firmly believe that remote work is the future. The data is clear... productivity goes up, commute times disappear, and people are happier." },
      { voiceId: "jessica", text: "I hear you, but I think we're losing something crucial. In-person collaboration sparks creativity in ways that a Zoom call simply can't replicate." },
      { voiceId: "george", text: "But studies show that deep work, the kind that actually moves the needle, happens best without office distractions." },
      { voiceId: "jessica", text: "True, but what about mentorship? Junior employees learn so much from just being around experienced colleagues." },
    ],
  },
  {
    id: "co-hosted",
    name: "Co-Hosted Show",
    description: "Two hosts with great chemistry discuss a topic together.",
    icon: "👥",
    mode: "multi",
    category: "interview",
    suggestedVoices: ["roger", "lily"],
    dialoguePrompt: "Two co-hosts with great banter discussing the latest trends in technology",
    segments: [
      { voiceId: "roger", text: "Hey everyone, welcome back to the show! We've got a packed episode today." },
      { voiceId: "lily", text: "We really do! I've been dying to talk about this all week. Have you seen what's happening with AI?" },
      { voiceId: "roger", text: "Oh, you mean the thing that's basically taking over every industry? Yeah, I might have noticed." },
      { voiceId: "lily", text: "Ha! Okay, let's dive in. So here's what caught my eye..." },
    ],
  },
  {
    id: "news-panel",
    name: "News Panel Discussion",
    description: "Multiple commentators discuss and analyze current events.",
    icon: "📺",
    mode: "multi",
    category: "news",
    suggestedVoices: ["george", "sarah", "brian"],
    dialoguePrompt: "A news panel with three commentators analyzing a major technology breakthrough",
    segments: [
      { voiceId: "george", text: "Breaking news today as we look at a major development that could reshape the industry. Let's bring in our panel." },
      { voiceId: "sarah", text: "Thanks, George. From what I'm seeing, this is bigger than most people realize. The implications are enormous." },
      { voiceId: "brian", text: "I agree with Sarah, but I think we need to temper expectations. We've seen this kind of hype before." },
      { voiceId: "george", text: "That's a fair point. Let's break down what we actually know versus what's speculation." },
    ],
  },
];

export const templateCategories = [
  { id: "all", label: "All Templates" },
  { id: "monologue", label: "Monologue" },
  { id: "interview", label: "Interview" },
  { id: "news", label: "News" },
  { id: "debate", label: "Debate" },
  { id: "storytelling", label: "Storytelling" },
  { id: "educational", label: "Educational" },
] as const;
