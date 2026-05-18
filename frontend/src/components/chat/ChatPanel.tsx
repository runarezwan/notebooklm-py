"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { api, KnowledgeDoc } from "@/lib/api";
import { toast } from "sonner";

interface ChatMessage {
  role: string;
  content: string;
  cite?: string;
}

export default function ChatPanel() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [ingestTitle, setIngestTitle] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch knowledge base on mount
  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const docs = await api.knowledgeList();
      setKnowledgeDocs(docs.filter((d) => d.type === "circular"));
    } catch {
      // Backend offline
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage) return;

    const newMsg: ChatMessage = { role: "user", content: inputMessage };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    try {
      const data = await api.chat(inputMessage);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, cite: data.citation },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Backend is offline. Please start main.py" },
      ]);
    }
  };

  const handleIngest = async () => {
    if (!fileInputRef.current?.files?.[0] || !ingestTitle) {
      toast.warning("Please provide a title and select a PDF.");
      return;
    }
    setIsIngesting(true);
    try {
      const data = await api.ingest(fileInputRef.current.files[0], ingestTitle);
      toast.success(data.message);
      setIngestTitle("");
      fetchKnowledge();
    } catch {
      toast.error("Ingestion failed");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteKnowledge = async (docId: string) => {
    try {
      await api.knowledgeDelete(docId);
      toast.success("Circular removed");
      fetchKnowledge();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <motion.div
      key="policy"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full"
    >
      {/* Chat Area */}
      <div className="xl:col-span-3 h-full flex flex-col gap-6">
        <div className="bg-slate-900/50 rounded-3xl p-8 flex-1 border border-white/5 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 opacity-30">
              <div className="w-24 h-24 bg-slate-800 rounded-3xl rotate-12 flex items-center justify-center">
                <MessageSquare size={48} className="-rotate-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Bank CRM Gemini RAG</h2>
                <p className="max-w-xs mx-auto">Trained on Bangladesh Bank circulars and credit manuals.</p>
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-xl ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none"
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                {msg.cite && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                      {msg.cite}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleChat} className="relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about SME manual, NPL rules, or LTV ratios..."
            className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-2xl transition-all"
          />
          <button className="absolute right-4 top-4 bottom-4 aspect-square bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95">
            <ArrowUpRight size={20} />
          </button>
        </form>
      </div>

      {/* Ingestion Panel */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
            Knowledge Ingestion
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Circular Title"
              value={ingestTitle}
              onChange={(e) => setIngestTitle(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/10 transition-all"
            />
            <div
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} className="mx-auto mb-2 text-slate-500 group-hover:text-indigo-500 transition-colors" />
              <p className="text-xs text-slate-400">Click to upload BB Circular (PDF)</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" />
            </div>
            <button
              onClick={handleIngest}
              disabled={isIngesting}
              className="w-full bg-indigo-500/10 text-indigo-500 font-bold py-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
            >
              {isIngesting ? "Syncing..." : "Sync to Gemini"}
            </button>
          </div>
        </div>

        {/* Ingested Circulars List */}
        {knowledgeDocs.length > 0 && (
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
              Ingested Circulars
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {knowledgeDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2 group">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{doc.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {doc.chunk_count ? `${doc.chunk_count} chunks` : "1 doc"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteKnowledge(doc.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 bg-slate-800/20 border border-white/5 rounded-3xl">
          <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
            &quot;Phase 2 Manual Ingestion allows direct text extraction from official Bangladesh Bank PDFs for instant RAG grounding.&quot;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
