"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Download } from "lucide-react";
import TrendChart from "@/components/TrendChart";
import ProductDonut from "@/components/ProductDonut";
import { api, AuditLog, AuditStats } from "@/lib/api";
import { toast } from "sonner";

export default function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total_appraisals: 0, total_audit_events: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.auditLogs(page, 20),
        api.auditStats(),
      ]);
      setLogs(logsRes.logs);
      setStats(statsRes);
    } catch {
      // Backend offline — show empty state
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.warning("No logs to export");
      return;
    }
    const header = "Timestamp,Endpoint,Method,User,Status,Summary\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.timestamp}","${l.endpoint}","${l.method}","${l.user_id}","${l.status_code}","${l.summary}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <motion.div
      key="audit"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
            Total Appraisals (Cloud)
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">
              {stats.total_appraisals.toLocaleString()}
            </h3>
            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center border border-emerald-100">
              <TrendingUp size={12} className="mr-1" /> Live
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
            Audit Events
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">
              {stats.total_audit_events.toLocaleString()}
            </h3>
            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center border border-emerald-100">
              <TrendingUp size={12} className="mr-1" /> Tracked
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
            Policy Accuracy
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">
              99.8<span className="text-sm font-normal text-slate-400">%</span>
            </h3>
            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center border border-emerald-100">
              <TrendingUp size={12} className="mr-1" /> GEMINI
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
            Active Branches
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-800">14</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Live Multi-Branch TAT Performance
          </h3>
          <TrendChart />
        </div>
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Lead Status (Firestore Realtime)
          </h3>
          <ProductDonut />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 flex-1 overflow-hidden flex flex-col shadow-sm text-slate-800">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-xs uppercase tracking-widest text-emerald-600">
            Regulatory Audit Logs
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-slate-400 px-2">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={logs.length < 20}
                className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-30"
              >
                Next →
              </button>
            </div>
            <button
              onClick={exportCSV}
              className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <Download size={10} /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : logs.length > 0 ? (
            <table className="w-full text-left border-collapse text-slate-700">
              <thead className="bg-slate-50 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Service Path</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Summary</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log, i) => (
                  <tr key={log.id || i} className="hover:bg-slate-50/50 transition-all group cursor-default">
                    <td className="p-5 text-sm font-medium tracking-tight text-slate-700">{log.timestamp?.slice(0, 19) || "—"}</td>
                    <td className="p-5 text-sm text-slate-500">{log.endpoint}</td>
                    <td className="p-5 text-[10px] font-mono text-emerald-600 font-bold">{log.method}</td>
                    <td className="p-5 text-sm font-bold truncate max-w-xs">{log.summary}</td>
                    <td className="p-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                        log.status_code < 400
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                          : "bg-red-50 text-red-600 border-red-200/60"
                      }`}>
                        {log.status_code < 400 ? "Secured" : "Error"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500 italic uppercase tracking-widest text-[10px] font-bold">
              No audit logs recorded yet. Logs appear as API calls are made.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
