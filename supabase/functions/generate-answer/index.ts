const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAuthenticated(request: Request): Promise<boolean> {
  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !supabaseUrl || !anonKey) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  return response.ok;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method === "GET") {
    return (await isAuthenticated(request))
      ? jsonResponse({ ready: true })
      : jsonResponse({ error: "Sign in is required." }, 401);
  }
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (!(await isAuthenticated(request))) {
      return jsonResponse({ error: "Sign in is required." }, 401);
    }

    const payload = await request.json();
    const question = typeof payload.question === "string" ? payload.question.trim() : "";
    const talks = Array.isArray(payload.context_talks) ? payload.context_talks : [];
    if (!question || question.length > 2000 || talks.length < 1 || talks.length > 3) {
      return jsonResponse({ error: "Provide a question and one to three retrieved talks." }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "The answer service is not configured." }, 500);

    const context = talks.map((talk: Record<string, unknown>, index: number) => {
      const title = typeof talk.title === "string" ? talk.title : "Untitled talk";
      const speaker = typeof talk.speaker === "string" ? talk.speaker : "Unknown speaker";
      const text = typeof talk.text === "string" ? talk.text.slice(0, 30000) : "";
      return `[${index + 1}] ${title} — ${speaker}\n${text}`;
    }).join("\n\n---\n\n");

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "Answer using only the supplied General Conference talk excerpts. Cite each factual claim with the matching numbered source marker, such as [1] or [2]. Never invent a source number or claim a source says something absent from its text. If the excerpts do not answer the question, say so plainly. Be concise and distinguish direct teachings from your synthesis.",
          },
          {
            role: "user",
            content: `Question: ${question}\n\nRetrieved talk excerpts:\n${context}`,
          },
        ],
      }),
    });

    if (!openAIResponse.ok) {
      console.error("Answer provider returned status", openAIResponse.status);
      return jsonResponse({ error: "Could not generate an answer. Try again shortly." }, 502);
    }

    const result = await openAIResponse.json();
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (typeof answer !== "string" || !answer) {
      return jsonResponse({ error: "The answer service returned an empty response." }, 502);
    }

    return jsonResponse({ answer });
  } catch (error) {
    console.error("generate-answer failed:", error);
    return jsonResponse({ error: "The request could not be completed." }, 500);
  }
});
