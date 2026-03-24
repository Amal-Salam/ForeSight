/* eslint-disable prettier/prettier */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User Not Found");

    const me = await ctx.db
      .query("members")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!me) throw new Error("Forbidden");

    return ctx.db
      .query("tasks")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// Returns the current user's Convex ID — used by Dashboard to filter "My Tasks"
export const getMyUserId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    return user?._id.toString() ?? null;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("doing"), v.literal("done")),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Resolve the Convex user from Clerk identity
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Ensure membership
    const me = await ctx.db
      .query("members")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!me) throw new Error("Forbidden");

    return ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      title: args.title,
      description: args.description,
      status: args.status,
      assigneeId: args.assigneeId,
      dueDate: args.dueDate,
      storyPoints: args.storyPoints,
      createdAt: Date.now(),
      createdBy: user._id,
    });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("doing"), v.literal("done")),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
 
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
 
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
 
    const me = await ctx.db
      .query("members")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", task.workspaceId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!me) throw new Error("Forbidden");
 
    const { taskId, ...fields } = args;
    await ctx.db.patch(taskId, fields);
  },
});

// Accept AI suggestion — locks the AI date as the official due date
export const acceptAISuggestion = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
 
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.iddSuggested) throw new Error("No AI suggestion to accept");
 
    await ctx.db.patch(args.taskId, {
      dueDate: task.iddSuggested,
      iddSuggested: undefined,
      aiReason: undefined,
    });
  },
});
 
// Override AI suggestion — dismiss it and keep the existing manual date
export const overrideAISuggestion = mutation({
  args: {
    taskId: v.id("tasks"),
    manualDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
 
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
 
    await ctx.db.patch(args.taskId, {
      dueDate: args.manualDate ?? task.dueDate,
      iddSuggested: undefined,
      aiReason: undefined,
    });
  },
});
 
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
 
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
 
    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
 
    const me = await ctx.db
      .query("members")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", task.workspaceId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!me) throw new Error("Forbidden");
 
    await ctx.db.delete(args.taskId);
  },
});

export const updateAISuggestion = mutation({
  args: {
    taskId: v.id("tasks"),
    suggestedDate: v.number(),
    aiReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      iddSuggested: args.suggestedDate,
      aiReason: args.aiReason,
    });
  },
});
