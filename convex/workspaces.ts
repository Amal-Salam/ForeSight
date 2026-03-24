/* eslint-disable prettier/prettier */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all workspaces the current user is a member of
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const memberships = await ctx.db
      .query("members")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();

    const workspaces = await Promise.all(
      memberships.map((m) => ctx.db.get(m.workspaceId))
    );

    return workspaces
      .filter(Boolean)
      .map((ws) => ({
        ...ws!,
        role: memberships.find((m) => m.workspaceId === ws!._id)?.role,
      }));
  },
});

// Get all members of a workspace with their user details
export const listMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
 
    const memberships = await ctx.db
      .query("members")
      .withIndex("byWorkspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
 
    const users = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          userId: user._id.toString(),
          name: user.name ?? user.email ?? "Unknown",
          email: user.email,
          role: m.role,
        };
      })
    );
 
    return users.filter(Boolean) as {
      userId: string;
      name: string;
      email: string;
      role: "admin" | "member";
    }[];
  },
});

// Create a new workspace and make the creator an admin member
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("byClerk", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name.trim(),
      ownerId: user._id,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId,
      userId: user._id,
      role: "admin",
    });

    return workspaceId;
  },
});