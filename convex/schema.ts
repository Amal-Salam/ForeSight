/* eslint-disable prettier/prettier */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("byClerk", ["clerkId"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }),

  members: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("byWorkspace", ["workspaceId"])
    .index("byUser", ["userId"]),
  invites: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    token: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("byToken", ["token"])
    .index("byWorkspace", ["workspaceId"])
    .index("byEmail", ["email"]),
    
  tasks: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("doing"), v.literal("done")),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    iddSuggested: v.optional(v.number()),
    aiReason: v.optional(v.string()),       // ← new: stores AI's reasoning for due date
    storyPoints: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("byWorkspace", ["workspaceId"]),
});
