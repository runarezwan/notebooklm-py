'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Lead {
  product: string;
  status: string;
}

const ProductDonut: React.FC = () => {
  const [counts, setCounts] = useState({ 'Home Loan': 0, 'Auto Loan': 0, 'SME / Personal': 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/history');
        const data: Lead[] = await res.json();

        const newCounts = { 'Home Loan': 0, 'Auto Loan': 0, 'SME / Personal': 0 } as Record<string, number>;
        data.forEach((lead) => {
          const key = lead.product as string;
          if (key in newCounts) {
            newCounts[key]++;
          } else {
            newCounts['SME / Personal']++;
          }
        });

        setCounts(newCounts as typeof counts);
        setTotal(data.length);
      } catch {
        // Backend offline — keep zeros shown as N/A
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
    // Refresh every 15 seconds for near-realtime feel
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, []);

  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const colors = ['#059669', '#0d9488', '#22c55e'];

  return (
    <div className="w-full bg-transparent p-4">
      {loading ? (
        <div className="h-[320px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Plot
          data={[
            {
              type: 'pie',
              labels,
              values,
              hole: 0.65,
              marker: {
                colors,
                line: { color: '#ffffff', width: 3 },
              },
              textinfo: 'percent',
              textposition: 'outside',
              textfont: { color: '#475569', size: 12 },
              hoverinfo: 'label+value+percent',
              direction: 'clockwise',
              sort: false,
            },
          ]}
          layout={{
            showlegend: true,
            legend: {
              x: 0.5,
              y: -0.15,
              xanchor: 'center',
              orientation: 'h',
              font: { color: '#475569', size: 11 },
            },
            annotations: [
              {
                text: `<b>${total.toLocaleString()}</b><br><span style="font-size:11px;color:#64748b">Live Leads</span>`,
                showarrow: false,
                font: { size: 22, color: '#1e293b', family: 'Inter, sans-serif' },
                x: 0.5,
                y: 0.5,
              },
            ],
            margin: { t: 20, r: 20, l: 20, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#1e293b', family: 'Inter, sans-serif' },
            autosize: true,
            height: 320,
          }}
          useResizeHandler
          style={{ width: '100%' }}
          config={{ displayModeBar: false }}
        />
      )}
    </div>
  );
};

export default ProductDonut;
