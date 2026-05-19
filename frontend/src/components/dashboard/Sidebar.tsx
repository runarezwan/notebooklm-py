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
    <aside className="w-72 bg-white border-r border-slate-200/80 p-6 flex flex-col gap-8 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0">
          <ShieldCheck className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
          CRM Solution
          <br />
          <span className="text-emerald-600 font-extrabold">App for Bank</span>
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
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Status Panel */}
      <div className="mt-auto p-4 space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Node Status
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${
                  backendStatus === "connected"
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : backendStatus === "checking"
                      ? "bg-emerald-600 shadow-emerald-600/50"
                      : "bg-red-500 shadow-red-500/50"
                }`}
              />
              <span className="text-[9px] font-black uppercase text-slate-600">
                {backendStatus === "connected"
                  ? "FastAPI Online"
                  : backendStatus === "checking"
                    ? "Syncing..."
                    : "System Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Security Core
            </span>
            <span className="text-[9px] font-black uppercase text-emerald-600">
              V.2.0 Active
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-red-600 transition-colors"
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
