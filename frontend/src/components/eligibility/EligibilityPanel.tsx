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
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-600">
            <FileText size={18} />
            Lead Details
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-500 mb-2 block">Customer Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                />
                <label className="absolute right-2 top-2 bottom-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center px-2 cursor-pointer transition-colors" title="Upload NID/License for OCR">
                  <UploadCloud size={16} className={isOCRProcessing ? "animate-bounce text-emerald-500" : "text-slate-500"} />
                  <input type="file" className="hidden" onChange={handleOCR} accept="image/*,.pdf" />
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 mb-2 block">Product Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option>Home Loan</option>
                <option>Auto Loan</option>
                <option>SME / Personal</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Income</span>
                <span className="font-bold tracking-tight text-slate-800">{income.toLocaleString()} BDT</span>
              </div>
              <input type="range" min="50000" max="500000" step="5000" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full accent-emerald-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tenure</span>
                <span className="font-bold text-slate-800">{tenure} Years</span>
              </div>
              <input type="range" min="5" max="25" step="1" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full accent-emerald-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Interest Rate</span>
                <span className="font-bold tracking-tight text-slate-800">{rate}%</span>
              </div>
              <input type="range" min="8" max="18" step="0.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-emerald-600" />
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-95"
        >
          <Download size={20} />
          Download Proposal (PDF)
        </button>
      </div>

      {/* Visualization */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs mb-1">Income Limit</p>
            <h3 className="text-2xl font-black text-slate-800">{(result.income_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-slate-400">Lac</span></h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs mb-1">Asset Limit</p>
            <h3 className="text-2xl font-black text-slate-800">{(result.asset_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-slate-400">Lac</span></h3>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 rounded-2xl shadow-md shadow-emerald-500/10">
            <p className="text-white/80 text-xs mb-1 font-bold">Final Approved</p>
            <h3 className="text-2xl font-black text-white">{(result.final_limit / 100000).toFixed(1)} <span className="text-xs font-normal text-emerald-100">Lac</span></h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex items-center justify-center">
            <EligibilityChart incomeLimit={result.income_limit} assetLimit={result.asset_limit} finalLimit={result.final_limit} />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex items-center justify-center">
            <RadarChart incomeLimit={result.income_limit} assetLimit={result.asset_limit} finalLimit={result.final_limit} income={income} tenure={tenure} rate={rate} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
