"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";

import { useAuth } from "@/lib/AuthContext";
import { useBackendStatus } from "@/hooks/useBackendStatus";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import LoginModal from "@/components/auth/LoginModal";
import EligibilityPanel from "@/components/eligibility/EligibilityPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import CIBPanel from "@/components/cib/CIBPanel";
import AuditPanel from "@/components/audit/AuditPanel";
import ReportsPanel from "@/components/reports/ReportsPanel";

export default function Dashboard() {
  const { user, role, logout } = useAuth();
  const { status: backendStatus } = useBackendStatus();
  const [activeTab, setActiveTab] = useState("policy");
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        onLoginRequired={() => setShowLogin(true)}
        onLogout={logout}
        backendStatus={backendStatus}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Offline Banner */}
        {backendStatus === "error" && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-8 py-2 flex items-center gap-2 text-red-400 text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Backend Offline — Start FastAPI server to restore full functionality
          </div>
        )}

        {/* Header */}
        <Header
          user={user}
          role={role}
          onLogout={logout}
          onLoginClick={() => setShowLogin(true)}
        />

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "eligibility" && <EligibilityPanel />}
            {activeTab === "policy" && <ChatPanel />}
            {activeTab === "cib" && <CIBPanel />}
            {activeTab === "audit" && <AuditPanel />}
            {activeTab === "reports" && <ReportsPanel />}
          </AnimatePresence>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
