"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, UploadCloud, Download } from "lucide-react";
import EligibilityChart from "@/components/EligibilityChart";
import RadarChart from "@/components/RadarChart";
import { generateProposalPDF } from "@/lib/pdfGenerator";
import { api, EligibilityResponse } from "@/lib/api";
import { toast } from "sonner";

export default function EligibilityPanel() {
  const [customerName, setCustomerName] = useState("Rahman & Sons");
  const [income, setIncome] = useState(120000);
  const [emi, setEmi] = useState(25000);
  const [assetVal, setAssetVal] = useState(4000000);
  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(11.5);
  const [productType, setProductType] = useState("Home Loan");
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [result, setResult] = useState<EligibilityResponse>({
    income_limit: 0,
    asset_limit: 0,
    final_limit: 0,
    status: "",
  });

  useEffect(() => {
    const calculate = async () => {
      try {
        const data = await api.eligibility({
          product_type: productType,
          income,
          existing_emi: emi,
          asset_value: assetVal,
          tenure_years: tenure,
          interest_rate: rate,
          customer_name: customerName,
        });
        setResult(data);
      } catch {
        // Backend offline — keep previous values
      }
    };
    calculate();
  }, [income, emi, assetVal, tenure, rate, productType, customerName]);

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOCRProcessing(true);
    try {
      const data = await api.ocr(file);
      if (data.status === "Success") {
        setCustomerName(data.extracted_data.name);
        toast.success(`OCR Success! Extracted Name: ${data.extracted_data.name}`);
      }
    } catch {
      toast.error("OCR processing failed");
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleDownload = () => {
    generateProposalPDF({
      customerName,
      productType,
      finalLimit: result.final_limit,
      income,
      assetValue: assetVal,
    });
    toast.success("PDF downloaded successfully");
  };

  return (
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
              <input type="range" min="50000" max="500000" step="5000" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tenure</span>
                <span className="font-bold">{tenure} Years</span>
              </div>
              <input type="range" min="5" max="25" step="1" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Interest Rate</span>
                <span className="font-bold tracking-tight">{rate}%</span>
              </div>
              <input type="range" min="8" max="18" step="0.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-indigo-500" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-4 flex items-center justify-center">
            <EligibilityChart incomeLimit={result.income_limit} assetLimit={result.asset_limit} finalLimit={result.final_limit} />
          </div>
          <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-4 flex items-center justify-center">
            <RadarChart incomeLimit={result.income_limit} assetLimit={result.asset_limit} finalLimit={result.final_limit} income={income} tenure={tenure} rate={rate} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
