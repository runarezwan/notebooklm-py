"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Fingerprint,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api, CIBResponse } from "@/lib/api";

export default function CIBPanel() {
  const [cibName, setCibName] = useState("");
  const [cibNid, setCibNid] = useState("");
  const [cibResult, setCibResult] = useState<CIBResponse | null>(null);
  const [isCibLoading, setIsCibLoading] = useState(false);

  const handleCIB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cibName.trim()) return;
    setIsCibLoading(true);
    setCibResult(null);
    try {
      const data = await api.cib({
        customer_name: cibName,
        nid_number: cibNid || null,
      });
      setCibResult(data);
    } catch {
      setCibResult({
        customer_found: false,
        record_count: 0,
        history: [],
        cib_analysis: "Backend is offline. Please start main.py to run CIB analysis.",
      });
    } finally {
      setIsCibLoading(false);
    }
  };

  return (
    <motion.div
      key="cib"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-[600px]"
    >
      {/* Search Panel */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
          <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Fingerprint size={16} />
            CIB Search
          </h3>
          <form onSubmit={handleCIB} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Customer Name</label>
              <input
                type="text"
                value={cibName}
                onChange={(e) => setCibName(e.target.value)}
                placeholder="e.g. Rahman & Sons"
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">NID / TIN Number</label>
              <input
                type="text"
                value={cibNid}
                onChange={(e) => setCibNid(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isCibLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isCibLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={18} />
              )}
              {isCibLoading ? "Verifying..." : "Run CIB Check"}
            </button>
          </form>
        </div>

        <div className="p-6 bg-slate-800/10 border border-white/5 rounded-3xl">
          <div className="flex gap-4 items-start mb-4">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              <ShieldCheck size={16} className="text-indigo-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1">Secure Protocol</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Verification is performed against internal historical datasets using Gemini Pro 1.5 logic.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        {!cibResult && !isCibLoading && (
          <div className="flex-1 bg-slate-900/20 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-4">
            <Fingerprint size={64} className="opacity-10" />
            <p className="text-sm font-medium">Enter customer details to perform AI-powered credit risk audit.</p>
          </div>
        )}

        {isCibLoading && (
          <div className="flex-1 bg-slate-900/20 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Running AI risk assessment...</p>
          </div>
        )}

        {cibResult && (
          <>
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                {cibResult.customer_found ? (
                  <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} /> Record Matches Found
                  </div>
                ) : (
                  <div className="bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> New Customer Entry
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                Risk Analysis Report
                <span className="text-xs font-normal text-slate-500">Provided by CRM Solution Gemini 1.5</span>
              </h2>

              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm bg-slate-800/30 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">
                {cibResult.cib_analysis}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">
                  Historical Transaction Records ({cibResult.record_count})
                </h3>
              </div>
              <div className="overflow-auto max-h-[300px] custom-scrollbar">
                {cibResult.history.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-800/50 text-slate-500 font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-4 border-b border-white/5">Transaction ID</th>
                        <th className="p-4 border-b border-white/5">Status</th>
                        <th className="p-4 border-b border-white/5 text-right">Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cibResult.history.map((h, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono">{String(h.id ?? "")}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${
                              h.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            }`}>
                              {String(h.status ?? "")}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold">{Number(h.amount ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-500 italic uppercase tracking-widest text-[10px] font-bold">
                    No historical records matching criteria.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
