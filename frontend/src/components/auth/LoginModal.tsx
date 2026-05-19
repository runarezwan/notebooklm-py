"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Authentication successful");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4">
            <Lock className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Admin Access</h2>
          <p className="text-slate-500 text-sm mt-2">
            Required for System Audit &amp; CIB Verification
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-emerald-600 text-sm font-bold mt-2"
          >
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  );
}
