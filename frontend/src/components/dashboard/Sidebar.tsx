"use client";

import React from "react";
import {
  BarChart3,
  MessageSquare,
  Banknote,
  LayoutDashboard,
  Fingerprint,
  ShieldCheck,
  Lock,
  LogOut,
} from "lucide-react";
import { BackendStatus } from "@/hooks/useBackendStatus";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: "admin" | "user" | null;
  onLoginRequired: () => void;
  onLogout: () => void;
  backendStatus: BackendStatus;
}

const NAV_ITEMS = [
  { id: "policy", label: "Gemini RAG Assistant", icon: MessageSquare },
  { id: "eligibility", label: "Eligibility Hub", icon: Banknote },
  { id: "cib", label: "CIB Verify", icon: Fingerprint, admin: true },
  { id: "audit", label: "System Audit", icon: BarChart3, admin: true },
  { id: "reports", label: "Unified Reports", icon: LayoutDashboard },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  onLoginRequired,
  onLogout,
  backendStatus,
}: SidebarProps) {
  return (
    <aside className="w-72 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
          <ShieldCheck className="text-slate-900" />
        </div>
        <span className="font-bold text-sm tracking-tight text-white leading-tight">
          CRM Solution
          <br />
          <span className="text-violet-400">App for Bank</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.admin && role !== "admin") {
                onLoginRequired();
              } else {
                setActiveTab(item.id);
              }
            }}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all relative group ${
              activeTab === item.id
                ? "bg-violet-400 text-slate-900 shadow-lg shadow-violet-500/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} />
              <span className="font-bold text-sm tracking-tight">
                {item.label}
              </span>
            </div>
            {item.admin && role !== "admin" && (
              <Lock size={12} className="opacity-40" />
            )}
            {item.admin && role === "admin" && (
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Status Panel */}
      <div className="mt-auto p-4 space-y-4">
        <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Node Status
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${
                  backendStatus === "connected"
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : backendStatus === "checking"
                      ? "bg-violet-500 shadow-violet-500/50"
                      : "bg-red-500 shadow-red-500/50"
                }`}
              />
              <span className="text-[9px] font-black uppercase text-slate-300">
                {backendStatus === "connected"
                  ? "FastAPI Online"
                  : backendStatus === "checking"
                    ? "Syncing..."
                    : "System Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Security Core
            </span>
            <span className="text-[9px] font-black uppercase text-emerald-500">
              V.2.0 Active
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm tracking-tight">
            System Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
