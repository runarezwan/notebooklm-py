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
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Lock className="text-white" />
          </div>
          <h2 className="text-2xl font-black">Admin Access</h2>
          <p className="text-slate-400 text-sm mt-2">
            Required for System Audit &amp; CIB Verification
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-white text-sm font-bold mt-2"
          >
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  );
}
