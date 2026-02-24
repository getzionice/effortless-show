import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: episodes, error } = await supabase
      .from("generations")
      .select("id, title, text_input, voice_name, audio_url, created_at, duration_seconds")
      .eq("is_published", true)
      .not("audio_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const siteUrl = req.headers.get("origin") || "https://podcraft.app";
    const now = new Date().toUTCString();

    const items = (episodes || [])
      .map((ep) => {
        const pubDate = new Date(ep.created_at).toUTCString();
        const title = escapeXml(ep.title || "Untitled Episode");
        const description = escapeXml(
          ep.text_input.length > 400
            ? ep.text_input.slice(0, 400) + "…"
            : ep.text_input
        );
        const duration = ep.duration_seconds
          ? Math.round(ep.duration_seconds)
          : 0;

        return `    <item>
      <title>${title}</title>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      <itunes:author>${escapeXml(ep.voice_name)}</itunes:author>
      <itunes:duration>${duration}</itunes:duration>
      ${ep.audio_url ? `<enclosure url="${escapeXml(ep.audio_url)}" type="audio/mpeg" length="0" />` : ""}
    </item>`;
      })
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Podcraft</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>AI-generated podcast episodes from Podcraft</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <itunes:author>Podcraft</itunes:author>
    <itunes:category text="Technology" />
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("RSS feed error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate feed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
