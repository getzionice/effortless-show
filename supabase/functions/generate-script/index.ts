import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, style, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!topic) {
      return new Response(JSON.stringify({ error: "topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wordCount = (duration || 5) * 150;
    const systemPrompt = `You are an expert podcast scriptwriter who creates authentic, listener-friendly audio content. Your scripts sound like a real podcast host — warm, knowledgeable, and naturally spoken.

Rules:
- Write as a podcast host speaking directly to listeners (use "you", "we", "let's")
- Open with a short, punchy hook that grabs attention in the first 10 seconds
- Include a brief podcast-style intro: "Welcome to..." or "Hey everyone, today we're diving into..."
- Use conversational transitions: "So here's the thing...", "Now, this is where it gets interesting...", "Let me break this down..."
- Add natural pauses with "..." and rhetorical questions to keep listeners engaged
- Vary sentence length — mix short punchy lines with longer explanations
- Include real-world examples, anecdotes, or relatable scenarios when possible
- Wrap up with a clear takeaway and a listener call-to-action: "If you enjoyed this, share it with a friend", "Let me know what you think", etc.
- Do NOT include speaker labels, stage directions, timestamps, or sound effect cues
- Do NOT write like a blog post, essay, or YouTube script — this is audio-first content meant for ears, not eyes
- Avoid bullet points, numbered lists, or visual formatting — everything must flow as spoken word
- Target approximately ${wordCount} words (~${duration || 5} minutes of speaking time)
- Style/tone: ${style || "conversational, warm, and informative — like chatting with a smart friend"}
- Write ONLY the script text, no titles, headers, or metadata`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Write a podcast script about: ${topic}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
