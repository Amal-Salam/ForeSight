/* eslint-disable prettier/prettier */
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─── Shared Gemini caller ────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error(`Gemini returned no candidates. Response: ${JSON.stringify(data)}`);
  }
  if (candidate.finishReason === "SAFETY") {
    throw new Error("Gemini blocked this response due to safety filters. Try rephrasing the task title.");
  }

  const raw = candidate.content?.parts?.[0]?.text ?? "";
  if (!raw) {
    throw new Error(`Gemini returned empty text. Finish reason: ${candidate.finishReason}`);
  }

  // Strip markdown fences — handles ```json, ```JSON, plain ```, with or without newlines
  return raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

// ─── 1. Smart Task Description ───────────────────────────────────────────────
export const generateTaskDescription = action({
  args: {
    title: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existingTasks = await ctx.runQuery(api.tasks.list, {
      workspaceId: args.workspaceId,
    });

    const context =
      existingTasks.length > 0
        ? `Existing tasks in this workspace: ${existingTasks
            .slice(0, 10)
            .map((t) => t.title)
            .join(", ")}`
        : "This is a new workspace with no existing tasks.";

    const prompt = `You are a senior software project manager writing clear, actionable task descriptions for a dev team.

${context}

New task title: "${args.title}"

Write a task description for this. Be specific and practical. Include:
1. A 2-3 sentence overview of what needs to be done
2. 2-4 bullet point acceptance criteria (what "done" looks like)
3. Any important technical considerations if relevant

Also suggest story points (1, 2, 3, 5, 8, or 13) based on complexity.

Respond ONLY with a JSON object. No markdown fences, no explanation, no extra text before or after. Just the raw JSON:
{"description": "Full description here", "storyPoints": 3, "reasoning": "One sentence here"}`;

    const raw = await callGemini(prompt);

    try {
      return JSON.parse(raw) as {
        description: string;
        storyPoints: number;
        reasoning: string;
      };
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON. Raw: ${raw}`);
    }
  },
});

// ─── 2. Smart Due Date Suggestions ──────────────────────────────────────────
export const suggestDueDates = action({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tasks = await ctx.runQuery(api.tasks.list, {
      workspaceId: args.workspaceId,
    });

    const pending = tasks.filter((t) => t.status !== "done");
    if (!pending.length) return [];

    const today = new Date().toISOString().split("T")[0];

    const taskSummary = pending.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      storyPoints: t.storyPoints ?? null,
      currentDueDate: t.dueDate
        ? new Date(t.dueDate).toISOString().split("T")[0]
        : null,
    }));

    const prompt = `You are a project management AI. Today is ${today}.

Suggest a realistic due date for each task below. Rules:
- Story points guide effort: 1-2 = 1-2 days, 3-5 = 3-5 days, 8 = 1 week, 13 = 2 weeks
- Space tasks out so they don't all land on the same day
- If a task already has a due date that seems reasonable, keep it
- "doing" tasks should be due sooner than "todo" tasks

Tasks:
${JSON.stringify(taskSummary, null, 2)}

Respond ONLY with a JSON array. No markdown fences, no explanation, no extra text before or after. Just the raw JSON array:
[{"id":"<task _id>","title":"<title>","suggestedDate":"YYYY-MM-DD","reason":"One sentence"}]`;

    const raw = await callGemini(prompt);

    let suggestions: Array<{
      id: string;
      title: string;
      suggestedDate: string;
      reason: string;
    }>;

    try {
      suggestions = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON. Raw: ${raw}`);
    }

    for (const s of suggestions) {
      await ctx.runMutation(api.tasks.updateAISuggestion, {
        taskId: s.id as any,
        suggestedDate: new Date(s.suggestedDate).getTime(),
        aiReason: s.reason,
      });
    }

    return suggestions;
  },
});