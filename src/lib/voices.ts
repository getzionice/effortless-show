export interface Voice {
  id: string;
  elevenLabsId: string;
  name: string;
  desc: string;
  sampleText: string;
}

export const voices: Voice[] = [
  {
    id: "roger",
    elevenLabsId: "CwhRBWXzGAHq8TQ4Fs17",
    name: "Roger",
    desc: "Warm, conversational male",
    sampleText: "Welcome to today's episode. Let's dive into something truly fascinating.",
  },
  {
    id: "sarah",
    elevenLabsId: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    desc: "Clear, professional female",
    sampleText: "In this episode, we explore the cutting edge of technology and innovation.",
  },
  {
    id: "george",
    elevenLabsId: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    desc: "Deep, authoritative male",
    sampleText: "Today we're going to look at the stories that are shaping our world.",
  },
  {
    id: "lily",
    elevenLabsId: "pFZP5JQG7iQjIQuC4Bku",
    name: "Lily",
    desc: "Friendly, upbeat female",
    sampleText: "Hey everyone! Get ready for an exciting episode packed with great insights.",
  },
  {
    id: "brian",
    elevenLabsId: "nPczCjzI2devNBz1zQrb",
    name: "Brian",
    desc: "Calm, narrative male",
    sampleText: "Let me take you on a journey through one of the most remarkable stories of our time.",
  },
  {
    id: "jessica",
    elevenLabsId: "cgSgspJ2msm6clMCkdW9",
    name: "Jessica",
    desc: "Energetic, engaging female",
    sampleText: "You're listening to the show that brings you the best conversations every week.",
  },
];
