/* eslint-disable prettier/prettier */
import { useState } from "react";
import { useAction, useMutation,useQuery } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { FiX, FiCalendar, FiZap, FiTrash2 ,FiUser} from "react-icons/fi";
import { BsRobot } from "react-icons/bs";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  dueDate?: number;
  storyPoints?: number;
  assigneeId?: string;
  iddSuggested?: number;
  aiReason?: string;
}

interface Props {
  task: Task;
  workspaceId: string;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

const STORY_POINTS = [1, 2, 3, 5, 8, 13];

export default function EditTaskModal({ task, workspaceId, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<"todo" | "doing" | "done">(task.status);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [storyPoints, setStoryPoints] = useState<number | null>(task.storyPoints ?? null);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId?.toString() ?? "");
  const [aiReasoning, setAiReasoning] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const generateDescription = useAction(api.ai.generateTaskDescription);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const members = useQuery(api.workspaces.listMembers,{
    workspaceId: workspaceId as any,
  });

  const handleGenerateDescription = async () => {
    if (!title.trim()) { setError("Enter a title first."); return; }
    setError("");
    setLoadingAI(true);
    try {
      const result = await generateDescription({
        title: title.trim(),
        workspaceId: workspaceId as any,
      });
      setDescription(result.description);
      setStoryPoints(result.storyPoints);
      setAiReasoning(result.reasoning);
    } catch (e) {
      setError("AI generation failed. Check your GEMINI_API_KEY.");
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    setError("");
    setSaving(true);
    try {
      await updateTask({
        taskId: task._id as any,
        title: title.trim(),
        description: description.trim(),
        status,
        assigneeId: assigneeId ? assigneeId as any : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        storyPoints: storyPoints ?? undefined,
      });
      onClose();
    } catch (e) {
      setError("Failed to save. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await removeTask({ taskId: task._id as any });
      onClose();
    } catch (e) {
      setError("Failed to delete task.");
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-indigo dark:text-white flex items-center gap-2">
            <BsRobot className="text-iris" size={20} />
            Edit Task
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <FiX size={20} />
          </button>
        </div>

        {/* AI suggestion banner if date was AI-suggested */}
        {task.iddSuggested && task.aiReason && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-iris/5 border border-iris/20 text-xs text-iris">
            <BsRobot size={13} className="mt-0.5 shrink-0" />
            <span><strong>AI suggested:</strong> {task.aiReason}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/50"
          />
        </div>

        {/* Description + AI button */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <button
              onClick={handleGenerateDescription}
              disabled={loadingAI || !title.trim()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-iris/10 text-iris hover:bg-iris/20 disabled:opacity-40 rounded-full transition"
            >
              <FiZap size={12} />
              {loadingAI ? "Generating..." : "✨ Regenerate with AI"}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/50 resize-none"
          />
          {aiReasoning && (
            <p className="text-xs text-iris/80 flex items-center gap-1">
              <BsRobot size={11} /> {aiReasoning}
            </p>
          )}
        </div>

        {/* Story points + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Story Points</label>
            <div className="flex flex-wrap gap-1.5">
              {STORY_POINTS.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setStoryPoints(storyPoints === pt ? null : pt)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    storyPoints === pt
                      ? "bg-iris text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-iris/20"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/*  Assignee + Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <FiUser size={13} /> Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/50"
            >
              <option value="">Unassigned</option>
              {(members ?? []).map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <FiCalendar size={13} /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/50"
          />
        </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              confirmDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
          >
            <FiTrash2 size={14} />
            {deleting ? "Deleting..." : confirmDelete ? "Confirm delete" : "Delete"}
          </button>

          {/* Cancel confirm delete */}
          {confirmDelete && !deleting && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-iris text-white text-sm font-semibold hover:bg-iris/80 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}