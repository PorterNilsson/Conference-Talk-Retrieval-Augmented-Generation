# Step 6: RAG — 🤖 All Lights Green!

```
  🏁 LAUNCH ──→ 🔐 SIGN IN ──→ ✅ KEYWORD ──→ ✅ SEMANTIC ──→ ▶ 🤖 RAG ──→ 🚀 YOURS
                                                                  ~~~~~~~
                                                                  YOU ARE HERE
```

## What You'll Learn
- What RAG (Retrieval Augmented Generation) is
- How to combine retrieval + generation for AI-powered answers
- How context windows work in LLMs
- How to build a second Edge Function

## Why This Matters

This is the culmination of everything you've built. Keyword search finds exact words. Semantic search finds similar meanings. RAG goes further — it **reads** the most relevant talks and **generates** a natural-language answer with citations. This is how modern AI assistants (ChatGPT, Perplexity, etc.) work under the hood.

## What to Do

### 1. Create the generate-answer Edge Function in the Dashboard

1. In **Edge Functions → Deploy a new function → Via Editor**, create `generate-answer`.
2. Replace the starter code with `supabase/functions/generate-answer/index.ts`, then deploy.
3. Turn off the platform's built-in JWT verification for this function. The code validates the signed-in user's token itself.
4. Test it from the Dashboard with a signed-in user's access token and one or more `context_talks`.

The function asks GPT-4o to ground its answer in the retrieved talks and mark claims with numbered references such as `[1]`. The app turns those references into links to the matching original talks. Keep the checked-in function file as the source of truth; dashboard edits themselves are not versioned.

### What's Happening Behind the Scenes

When you ask a question, the full RAG pipeline executes:

```
Your Question: "How can I find peace during hard times?"
    ↓
1. embed-question Edge Function
    → Sends question to OpenAI
    → Returns 1,536-dimensional embedding
    ↓
2. Vector Search (match_sentences)
    → pgvector finds 20 most similar sentences
    → Groups by talk_id, ranks by relevance
    → Returns top 3 talks
    ↓
3. Fetch full talk text
    → Retrieves all sentences for the top 3 talks
    → Reconstructs complete talk context
    ↓
4. generate-answer Edge Function
    → Sends question + full talk context to GPT-4o
    → Returns a natural language answer with citations
    ↓
5. Display in UI ✨
```

> 💡 **Ask your AI assistant**: *"What is RAG and why is it better than fine-tuning for this use case?"*

### 2. Test the Function

Use the Dashboard function tester to send a signed-in request. Confirm it returns an `answer` string with numbered source markers.

### 3. All Three Lights Green! 🟢🟢🟢

After deploying:

1. **Refresh your site** (hard refresh: Ctrl+Shift+R)
2. All three panels should show **🟢 Ready**!

Try asking: *"What have church leaders taught about prayer?"*

You should get an AI-generated answer with source citations!

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Search shows "Not Ready" | Make sure you completed the relevant step (data import, edge function deployment) |
| "Failed to get embedding" | Check Edge Function deployment and that OPENAI_API_KEY secret is set |
| No search results | Verify data was imported (check row count in Supabase Dashboard) |
| Login doesn't work | Check redirect URL in Supabase Auth settings |
| Changes don't appear | Hard refresh (Ctrl+Shift+R) or try incognito window |

## Verification

- [ ] `generate-answer` function deployed without errors
- [ ] All three search panels show **🟢 Ready**
- [ ] Keyword search returns relevant results
- [ ] Semantic search returns results even for non-exact-match queries
- [ ] RAG returns an AI-generated answer with talk citations
- [ ] 📸 **Take a screenshot** of a working RAG query — you'll need this for submission!

## 🎉 Milestone: All lights green! Your RAG app is complete!

> 💾 **Commit your work!** `git add -A && git commit -m "All search modes working" && git push`

## → Next: [Step 07: Make It Yours](07_make_it_yours.md)
