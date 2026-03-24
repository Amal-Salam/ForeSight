/* eslint-disable prettier/prettier */
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// Called by the Clerk webhook — internal so it can't be called from the browser
export const upsert = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        avatarUrl: args.avatarUrl,
      });
      return existing._id;
    }

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });
  },
});

// Called from the browser on first load — ensures the user exists
// even if the webhook hasn't fired yet (e.g. during local development)
export const ensureExists = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) return existing._id;

    return ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
      avatarUrl: identity.profileUrl ?? undefined,
      createdAt: Date.now(),
    });
  },
});