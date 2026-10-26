# Step 5: Embeddings & Semantic Search — 🧠 Second Green Light!

```
  🏁 LAUNCH ──→ 🔐 SIGN IN ──→ ✅ KEYWORD ──→ ▶ 🧠 SEMANTIC ──→ 🤖 RAG ──→ 🚀 YOURS
                                                   ~~~~~~~~~~~~
                                                   YOU ARE HERE
```

## What You'll Learn
- What vector embeddings are and how they represent meaning
- Why we split text into sentences (chunking strategy)
- How OpenAI's embedding API works
- What Edge Functions are and why we need them
- How to deploy serverless functions with the Supabase CLI

## Why This Matters

Keyword search is powerful, but it only finds exact matches. Try searching for *"How can I find peace during hard times?"* with keyword search — you probably won't get great results. Semantic search solves this by understanding **meaning**, not just words. After this step, that same question will find talks about comfort, hope, and overcoming trials.

> 💪 **This is the biggest step in the assignment** — embedding generation, database updates, CLI setup, and edge function creation. Grab a snack while embeddings generate (~15 min). You've got this!

## What to Do

### Step 5a: Generate Embeddings

Run the embedding script to generate vector representations and save them to disk:

```bash
python scripts/04_embed_data.py
```

This script:
1. Reads `scripts/output/sentences.json`
2. Calls OpenAI's `text-embedding-3-small` to generate a 1,536-dimensional vector for each sentence
3. Saves results to `scripts/output/sentences_with_embeddings.json`
4. Supports resuming if interrupted (your progress is saved!)

> ⏱️ **This takes 10-15 minutes** and costs ~$0.60 in OpenAI API usage.
> 💰 **Your embeddings are safe**: They're saved to disk in `scripts/output/`, so even if the next step fails, you won't pay twice.

### Step 5b: Update Database with Embeddings

```bash
python scripts/05_update_embeddings.py
```

This reads the saved embeddings and updates each row in the database.

### How Embeddings Work

```
"Faith is the assurance of things hoped for"
    ↓ OpenAI text-embedding-3-small
[0.012, -0.034, 0.089, ... 1,536 dimensions]
```

Similar sentences produce similar vectors. This is what enables semantic search — finding content by **meaning** rather than exact keywords.

> 💡 **Ask your AI assistant**: *"What are the trade-offs between different chunking strategies in RAG systems? Why did we choose sentence-level chunking?"*

### Step 5c: Create & Deploy the embed-question Edge Function in the Dashboard

Your app needs to call OpenAI's API to embed user questions, but you can't put your API key in client-side JavaScript (anyone could steal it). Edge Functions solve this:

```
❌ Bad:  Browser → OpenAI API (API key exposed in browser!)
✅ Good: Browser → Edge Function → OpenAI API (API key stays on server)
```

**You'll create an Edge Function called `embed-question`** that:
- Receives a question from the browser
- Calls OpenAI to generate an embedding vector
- Returns the embedding to the browser

1. In the Supabase Dashboard, open **Edge Functions → Secrets** and add `OPENAI_API_KEY`. Supabase supplies the project URL and API keys to the function runtime.
2. Open **Edge Functions → Deploy a new function → Via Editor** and name it `embed-question`.
3. Replace the starter code with `supabase/functions/embed-question/index.ts`, then deploy.
4. On the function's detail page, turn off the platform's built-in JWT verification. The code manually checks the signed-in user's token with Supabase Auth.
5. Test the function from the Dashboard using a signed-in user's access token and a JSON body such as `{ "question": "How can I find peace?" }`.

Keep the checked-in TypeScript file as the source of truth; Dashboard edits themselves are not versioned. See [Supabase's dashboard guide](https://supabase.com/docs/guides/functions/quickstart-dashboard).

### 3. See Your Second Green Light! 🟢

After deploying the embed-question function:

1. **Refresh your site** (hard refresh: Ctrl+Shift+R)
2. The **🧠 Semantic Search** panel should now show **🟢 Ready**!

Try searching for *"How can I find peace during hard times?"* — notice how it finds relevant talks even without those exact keywords!

## Verification

- [ ] `04_embed_data.py` completes and reports embeddings generated
- [ ] `scripts/output/sentences_with_embeddings.json` exists (your safety net!)
- [ ] `05_update_embeddings.py` completes and reports rows updated
- [ ] `embed-question` function deployed without errors
- [ ] You can see the function in Supabase Dashboard → Edge Functions
- [ ] On your site: **🧠 Semantic Search** turns green and returns results!

## 🎉 Milestone: Second green light! Semantic Search works!

## → Next: [Step 06: RAG — All Lights Green](06_rag.md)
