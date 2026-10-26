const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  // Supabase Auth verifies the user's JWT. The public key identifies the
  // project; it does not grant the elevated access of a service-role key.
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
    if (!question || question.length > 2000) {
      return jsonResponse({ error: "Question must contain 1–2,000 characters." }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "The embedding service is not configured." }, 500);

    const openAIResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: question }),
    });

    if (!openAIResponse.ok) {
      console.error("Embedding provider returned status", openAIResponse.status);
      return jsonResponse({ error: "Could not create an embedding. Try again shortly." }, 502);
    }

    const result = await openAIResponse.json();
    const embedding = result.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      console.error("Embedding provider returned an unexpected vector shape.");
      return jsonResponse({ error: "The embedding service returned an unexpected result." }, 502);
    }

    return jsonResponse({ embedding });
  } catch (error) {
    console.error("embed-question failed:", error);
    return jsonResponse({ error: "The request could not be completed." }, 500);
  }
});
