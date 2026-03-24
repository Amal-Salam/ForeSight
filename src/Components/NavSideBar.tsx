/* eslint-disable prettier/prettier */
import { useState } from "react";
import { FiMenu, FiX, FiHome, FiTrendingUp, FiSettings, FiPlus, FiChevronDown, FiCheck,FiUserPlus } from "react-icons/fi";
import { BsRobot } from "react-icons/bs";
import { twMerge } from "tailwind-merge";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { useWorkspace } from "../Lib/Workspacecontext.js";
import { useNavigate, useLocation } from "react-router-dom";
import InviteModal from "./InviteModal.js";


const navItems = [
  { label: "Dashboard", icon: FiHome, href: "/" },
  { label: "Predictive Timeline", icon: FiTrendingUp, href: "/timeline" },
  { label: "AI Preferences", icon: BsRobot, href: "/ai-settings" },
  { label: "Settings", icon: FiSettings, href: "/settings" },
];

export default function NavSidebar() {
  const [open, setOpen] = useState(true);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();
  const createWorkspace = useMutation(api.workspaces.create);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    setCreating(true);
    try {
      const id = await createWorkspace({ name: newWsName.trim() });
      setActiveWorkspaceId(id as string);
      setNewWsName("");
      setShowCreateWs(false);
      setWsDropdownOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
    <aside
      className={twMerge(
        "fixed left-0 top-0 h-full bg-slate-950 text-white flex flex-col transition-all duration-300 z-40",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className={twMerge("font-bold text-lg tracking-tight", !open && "hidden")}>
          TaskAutomate
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded hover:bg-white/10 transition"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Workspace Switcher */}
      {open && (
        <div className="relative px-3 pt-3 pb-1">
          <button
            onClick={() => setWsDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-iris/60 flex items-center justify-center text-xs font-bold shrink-0">
                {activeWorkspace?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="truncate font-medium">
                {activeWorkspace?.name ?? "Select workspace"}
              </span>
            </div>
            <FiChevronDown
              size={14}
              className={twMerge("shrink-0 transition-transform", wsDropdownOpen && "rotate-180")}
            />
          </button>

          {/* Dropdown */}
          {wsDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100 dark:border-gray-700">

              {/* Workspace list */}
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => {
                    setActiveWorkspaceId(ws._id);
                    setWsDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-iris/20 flex items-center justify-center text-xs font-bold text-iris">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{ws.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{ws.role}</p>
                    </div>
                  </div>
                  {ws._id === activeWorkspace?._id && (
                    <FiCheck size={14} className="text-iris shrink-0" />
                  )}
                </button>
              ))}

              {/* Create new workspace */}
              <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                {showCreateWs ? (
                  <div className="flex gap-2 p-1">
                    <input
                      autoFocus
                      type="text"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreateWorkspace(); if (e.key === "Escape") setShowCreateWs(false); }}
                      placeholder="Workspace name"
                      className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-iris/40"
                    />
                    <button
                      onClick={handleCreateWorkspace}
                      disabled={creating || !newWsName.trim()}
                      className="px-3 py-1.5 bg-iris text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-iris/80 transition"
                    >
                      {creating ? "..." : "Add"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateWs(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-iris hover:bg-iris/5 rounded-lg transition"
                  >
                    <FiPlus size={14} />
                    New workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 pt-2 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={twMerge(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm",
                active
                  ? "bg-white/20 font-semibold"
                  : "hover:bg-white/10 text-white/80"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={twMerge("", !open && "hidden")}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Invite Button */}
      {open && activeWorkspace && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowInvite(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm text-white/90"
            >
              <FiUserPlus size={16} className="shrink-0" />
              Invite teammates
            </button>
          </div>
        )}

      {/* Role badge at bottom */}
      {open && activeWorkspace?.role && (
        <div className="px-4 pb-4">
          <div className="px-3 py-2 rounded-lg bg-white/5 text-xs text-white/50 capitalize">
            {activeWorkspace.role} · {activeWorkspace.name}
          </div>
        </div>
      )}
    </aside>

    {/* Invite modal rendered outside aside to avoid z-index issues */}
      {showInvite && activeWorkspace && (
        <InviteModal
          workspaceId={activeWorkspace._id}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
    
    
  );
}