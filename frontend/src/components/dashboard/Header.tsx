"use client";

import React from "react";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import type { User } from "firebase/auth";

interface HeaderProps {
  user: User | null;
  role: "admin" | "user" | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Header({ user, role, onLogout, onLoginClick }: HeaderProps) {
  return (
    <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#020617]/50 backdrop-blur-xl z-10">
      <div className="flex items-center bg-slate-900/50 rounded-full px-4 py-2 border border-white/5 w-96">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search policies, leads, or records..."
          className="bg-transparent border-none outline-none px-3 text-sm flex-1"
        />
      </div>
      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold">{user.email?.split("@")[0]}</p>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">
                {role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <UserIcon size={18} /> Login
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-400 to-violet-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs uppercase">
            {user?.email?.[0] || "G"}
          </div>
        </div>
      </div>
    </header>
  );
}
