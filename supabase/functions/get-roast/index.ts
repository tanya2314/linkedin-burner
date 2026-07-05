import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle the browser's preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, imageBase64, mode } = await req.json();

    const instruction = mode === "roast"
      ? "You're reviewing a LinkedIn profile or post. Be witty and pointed but not cruel — funny, shareable, no personal attacks. Then provide a rewritten, improved version. Return ONLY valid JSON in this exact format: {\"roast\": \"...\", \"rewrite\": \"...\"}"
      : "You're reviewing a LinkedIn profile or post. Be honest but encouraging. Then provide a rewritten, improved version. Return ONLY valid JSON in this exact format: {\"roast\": \"...\", \"rewrite\": \"...\"}";

    const parts: any[] = [{ text: instruction }];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: imageBase64
        }
      });
      parts.push({ text: "Here is the LinkedIn screenshot to review." });
    } else {
      parts.push({ text: `Here is the LinkedIn content to review: ${text}` });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();

    return new Response(clean, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});