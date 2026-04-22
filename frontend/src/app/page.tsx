'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  MessageSquare, 
  ShieldCheck, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  Search,
  ArrowUpRight,
  TrendingUp,
  Banknote,
  Download,
  UploadCloud,
  FileText,
  Lock,
  User as UserIcon,
  LogOut,
  Fingerprint,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import EligibilityChart from '@/components/EligibilityChart';
import RadarChart from '@/components/RadarChart';
import TrendChart from '@/components/TrendChart';
import ProductDonut from '@/components/ProductDonut';
import { generateProposalPDF } from '@/lib/pdfGenerator';
import { useAuth } from '@/lib/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Dashboard() {
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('policy');
  const [customerName, setCustomerName] = useState('Rahman & Sons');
  const [income, setIncome] = useState(120000);
  const [emi, setEmi] = useState(25000);
  const [assetVal, setAssetVal] = useState(4000000);
  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(11.5);
  const [productType, setProductType] = useState('Home Loan');
  
  const [result, setResult] = useState({ income_limit: 0, asset_limit: 0, final_limit: 0 });
  const [chatMessages, setChatMessages] = useState<{role: string, content: string, cite?: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Phase 2 states
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ingestTitle, setIngestTitle] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CIB Verify states
  const [cibName, setCibName] = useState('');
  const [cibNid, setCibNid] = useState('');
  const [cibResult, setCibResult] = useState<{customer_found: boolean; record_count: number; history: Record<string, unknown>[]; cib_analysis: string} | null>(null);
  const [isCibLoading, setIsCibLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'error' | 'checking'>('checking');

  // Check backend connectivity
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/eligibility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_type: 'Home Loan', income: 100000, existing_emi: 0, asset_value: 0, tenure_years: 1, interest_rate: 10, customer_name: 'healthcheck' }) });
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('error');
      } catch {
        setBackendStatus('error');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update eligibility in real-time
  useEffect(() => {
    const calculate = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_type: productType,
            income,
            existing_emi: emi,
            asset_value: assetVal,
            tenure_years: tenure,
            interest_rate: rate,
            customer_name: customerName
          })
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Backend offline", err);
      }
    };
    calculate();
  }, [income, emi, assetVal, tenure, rate, productType, customerName]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage) return;
    
    const newMsg = { role: 'user', content: inputMessage };
    setChatMessages([...chatMessages, newMsg]);
    setInputMessage('');

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputMessage })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer, cite: data.citation }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Backend is offline. Please start main.py" }]);
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsOCRProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === "Success") {
        setCustomerName(data.extracted_data.name);
        alert(`OCR Success! Extracted Name: ${data.extracted_data.name}`);
      }
    } catch (err) {
      console.error("OCR Failed", err);
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleIngest = async () => {
    if (!fileInputRef.current?.files?.[0] || !ingestTitle) {
      alert("Please provide a title and select a PDF.");
      return;
    }
    
    setIsIngesting(true);
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('title', ingestTitle);

    try {
      const res = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      alert(data.message);
      setIngestTitle('');
    } catch (err) {
      console.error("Ingestion Failed", err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const handleCIB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cibName.trim()) return;
    setIsCibLoading(true);
    setCibResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/cib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: cibName, nid_number: cibNid || null })
      });
      const data = await res.json();
      setCibResult(data);
    } catch {
      setCibResult({
        customer_found: false,
        record_count: 0,
        history: [],
        cib_analysis: 'Backend is offline. Please start main.py to run CIB analysis.'
      });
    } finally {
      setIsCibLoading(false);
    }
  };

  const handleDownload = () => {
    generateProposalPDF({
      customerName,
      productType,
      finalLimit: result.final_limit,
      income,
      assetValue: assetVal
    });
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <ShieldCheck className="text-slate-900" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white leading-tight">AI Loan Risk Decision<br/><span className="text-violet-400">Intelligent Systems</span></span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'policy', label: 'Gemini RAG Assistant', icon: MessageSquare },
            { id: 'eligibility', label: 'Eligibility Hub', icon: Banknote },
            { id: 'cib', label: 'CIB Verify', icon: Fingerprint, admin: true },
            { id: 'audit', label: 'System Audit', icon: BarChart3, admin: true },
            { id: 'reports', label: 'Unified Reports', icon: LayoutDashboard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.admin && role !== 'admin') {
                  setShowLogin(true);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all relative group ${
                activeTab === item.id 
                  ? 'bg-violet-400 text-slate-900 shadow-lg shadow-violet-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              {item.admin && role !== 'admin' && (
                <Lock size={12} className="opacity-40" />
              )}
              {item.admin && role === 'admin' && (
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Status</span>
                <div className="flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${
                      backendStatus === 'connected' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                      backendStatus === 'checking' ? 'bg-violet-500 shadow-violet-500/50' : 
                      'bg-red-500 shadow-red-500/50'
                   }`} />
                   <span className="text-[9px] font-black uppercase text-slate-300">
                      {backendStatus === 'connected' ? 'FastAPI Online' : backendStatus === 'checking' ? 'Syncing...' : 'System Offline'}
                   </span>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Core</span>
                <span className="text-[9px] font-black uppercase text-emerald-500">V.2.0 Active</span>
             </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm tracking-tight">System Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
                   <p className="text-sm font-bold">{user.email?.split('@')[0]}</p>
                   <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{role}</p>
                 </div>
                 <button onClick={logout} className="text-slate-500 hover:text-white transition-colors">
                   <LogOut size={20} />
                 </button>
               </div>
            ) : (
               <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                 <UserIcon size={18} /> Login
               </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-400 to-violet-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs uppercase">
                {user?.email?.[0] || 'G'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'eligibility' && (
              <motion.div 
                key="eligibility"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-8"
              >
                {/* Inputs */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                  <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-500">
                       <FileText size={18} />
                       Lead Details
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Customer Name</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                          <label className="absolute right-2 top-2 bottom-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center px-2 cursor-pointer transition-colors" title="Upload NID/License for OCR">
                            <UploadCloud size={16} className={isOCRProcessing ? "animate-bounce text-indigo-500" : "text-slate-400"} />
                            <input type="file" className="hidden" onChange={handleOCR} accept="image/*,.pdf" />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Product Type</label>
                        <select 
                          value={productType}
                          onChange={(e) => setProductType(e.target.value)}
                          className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                          <option>Home Loan</option>
                          <option>Auto Loan</option>
                          <option>SME / Personal</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Monthly Income</span>
                          <span className="font-bold tracking-tight">{income.toLocaleString()} BDT</span>
                        </div>
                        <input 
                          type="range" min="50000" max="500000" step="5000" 
                          value={income} onChange={(e) => setIncome(Number(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Tenure</span>
                          <span className="font-bold">{tenure} Years</span>
                        </div>
                        <input 
                          type="range" min="5" max="25" step="1" 
                          value={tenure} onChange={(e) => setTenure(Number(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Interest Rate</span>
                          <span className="font-bold tracking-tight">{rate}%</span>
                        </div>
                        <input 
                          type="range" min="8" max="18" step="0.5" 
                          value={rate} onChange={(e) => setRate(Number(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleDownload}
                    className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                  >
                    <Download size={20} />
                    Download Proposal (PDF)
                  </button>
                </div>

                {/* Visualization */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-white/5">
                        <p className="text-slate-400 text-xs mb-1">Income Limit</p>
                        <h3 className="text-2xl font-black">{(result.income_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-slate-500">Lac</span></h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-white/5">
                        <p className="text-slate-400 text-xs mb-1">Asset Limit</p>
                        <h3 className="text-2xl font-black">{(result.asset_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-slate-500">Lac</span></h3>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-5 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <p className="text-white/60 text-xs mb-1 font-bold">Final Approved</p>
                        <h3 className="text-2xl font-black text-white">{(result.final_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-white/50">Lac</span></h3>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-4 flex items-center justify-center">
                        <EligibilityChart 
                        incomeLimit={result.income_limit} 
                        assetLimit={result.asset_limit} 
                        finalLimit={result.final_limit} 
                        />
                    </div>
                    <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-4 flex items-center justify-center">
                        <RadarChart
                        incomeLimit={result.income_limit}
                        assetLimit={result.asset_limit}
                        finalLimit={result.final_limit}
                        income={income}
                        tenure={tenure}
                        rate={rate}
                        />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'policy' && (
              <motion.div 
                key="policy"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full"
              >
                <div className="xl:col-span-3 h-full flex flex-col gap-6">
                  <div className="bg-slate-900/50 rounded-3xl p-8 flex-1 border border-white/5 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-6 opacity-30">
                        <div className="w-24 h-24 bg-slate-800 rounded-3xl rotate-12 flex items-center justify-center">
                          <MessageSquare size={48} className="-rotate-12"/>
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">Bank CRM Gemini RAG</h2>
                          <p className="max-w-xs mx-auto">Trained on Bangladesh Bank circulars and credit manuals.</p>
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-xl ${
                          msg.role === 'user' 
                          ? 'bg-indigo-500 text-white rounded-tr-none' 
                          : 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none'
                        }`}>
                          <p className="text-[15px] leading-relaxed">{msg.content}</p>
                          {msg.cite && (
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{msg.cite}</span>
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
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Knowledge Ingestion</h3>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Circular Title"
                        value={ingestTitle}
                        onChange={(e) => setIngestTitle(e.target.value)}
                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/10 transition-all"
                      />
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
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
                  
                  <div className="p-6 bg-slate-800/20 border border-white/5 rounded-3xl">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      &quot;Phase 2 Manual Ingestion allows direct text extraction from official Bangladesh Bank PDFs for instant RAG grounding.&quot;
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'cib' && (
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
                        {isCibLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
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
                           <p className="text-[10px] text-slate-400 leading-relaxed">Verification is performed against internal historical datasets using Gemini Pro 1.5 logic.</p>
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

                  {cibResult && (
                    <>
                      {/* Analysis Card */}
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
                           <span className="text-xs font-normal text-slate-500">Provided by AI Loan Risk Gemini 1.5</span>
                        </h2>

                        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm bg-slate-800/30 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">
                          {cibResult.cib_analysis}
                        </div>
                      </div>

                      {/* Transaction Table */}
                      <div className="bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                          <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Historical Transaction Records ({cibResult.record_count})</h3>
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
                                    <td className="p-4 font-mono">{h.id}</td>
                                    <td className="p-4">
                                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${
                                        h.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                      }`}>
                                        {h.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right font-bold">{(h.amount || 0).toLocaleString()}</td>
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
            )}
            
            {activeTab === 'audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col gap-6"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Total Appraisals (Cloud)</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black tracking-tight">1,284</h3>
                      <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold flex items-center">
                        <TrendingUp size={12} className="mr-1" /> +12%
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Avg TAT</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black tracking-tight">1.7 <span className="text-sm font-normal text-slate-500">days</span></h3>
                      <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold flex items-center">
                        <TrendingUp size={12} className="mr-1" /> -60%
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Policy Accuracy</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black tracking-tight">99.8<span className="text-sm font-normal text-slate-500">%</span></h3>
                      <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold flex items-center">
                        <TrendingUp size={12} className="mr-1" /> GEMINI
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Active Branches</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black tracking-tight">14</h3>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-slate-900/20 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Live Multi-Branch TAT Performance</h3>
                    <TrendChart />
                  </div>
                  <div className="xl:col-span-1 bg-slate-900/20 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Lead Status (Firestore Realtime)</h3>
                    <ProductDonut />
                  </div>
                </div>
                
                {/* Logs Table */}
                <div className="bg-slate-900/50 rounded-3xl border border-white/5 flex-1 overflow-hidden flex flex-col shadow-2xl">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-black text-xs uppercase tracking-widest text-indigo-500">Regulatory Audit Logs</h2>
                    <button className="text-[10px] bg-slate-800 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Export Legal CSV</button>
                  </div>
                  <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Path</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Agent Action</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Policy Citation</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <tr key={i} className="hover:bg-white/5 transition-all group cursor-default">
                            <td className="p-5 text-sm font-medium tracking-tight">10:4{i} AM</td>
                            <td className="p-5 text-sm text-slate-400">Gemini RAG / OCR</td>
                            <td className="p-5 text-sm font-bold">NID Data Matched</td>
                            <td className="p-5 text-[10px] font-mono text-indigo-400">BB-NID-2024-SEC3</td>
                            <td className="p-5 text-right">
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border border-emerald-500/20">Secured</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full"
              >
                <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/50 group">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText size={32} className="text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white">Technical Report View</h2>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                    AI-generated technical analysis and site verification reports are compiled here. Extracted directly from field engineers' OCR data.
                  </p>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/50 group">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Banknote size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white">Income Report Analysis</h2>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                    Historical income data projection and predictive behavior analysis generated by Gemini 1.5 logic.
                  </p>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/50 group">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={32} className="text-violet-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white">Survey Report Auditing</h2>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                    Client satisfaction and post-disbursement survey data integrated with sentiment analysis metrics.
                  </p>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800/50 group">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Search size={32} className="text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white">Observation Dashboard</h2>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                    Centralized hub for manual observations, fraud detection flags, and credit deviation alerts marked by the system.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
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
              <p className="text-slate-400 text-sm mt-2">Required for System Audit & CIB Verification</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input 
                type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95">
                Authenticate
              </button>
              <button type="button" onClick={() => setShowLogin(false)} className="w-full text-slate-500 hover:text-white text-sm font-bold mt-2">
                Cancel
              </button>
            </form>
          </motion.div>
        </div>
      )}

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
