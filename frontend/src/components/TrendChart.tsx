'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const TrendChart: React.FC = () => {
    // Simulated monthly processing data for 12 months
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    const homeLoanVol  = [42, 55, 48, 63, 71, 68, 82, 90, 78, 95, 102, 110];
    const autoLoanVol  = [28, 32, 35, 30, 38, 42, 45, 50, 47, 55, 58, 62];
    const smeLoanVol   = [15, 18, 22, 20, 25, 28, 32, 35, 40, 38, 45, 48];
    const avgTAT       = [4.2, 3.9, 3.5, 3.8, 3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9, 1.7];

    return (
        <div className="w-full bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/10 shadow-2xl">
            <Plot
                data={[
                    {
                        x: months,
                        y: homeLoanVol,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Home Loan',
                        line: { color: '#f7b217', width: 2.5, shape: 'spline' },
                        marker: { size: 5 },
                        fill: 'tonexty',
                        fillcolor: 'rgba(247, 178, 23, 0.05)',
                    },
                    {
                        x: months,
                        y: autoLoanVol,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Auto Loan',
                        line: { color: '#6366f1', width: 2, shape: 'spline' },
                        marker: { size: 4 },
                        fill: 'tonexty',
                        fillcolor: 'rgba(99, 102, 241, 0.05)',
                    },
                    {
                        x: months,
                        y: smeLoanVol,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'SME',
                        line: { color: '#10b981', width: 2, shape: 'spline' },
                        marker: { size: 4 },
                    },
                    {
                        x: months,
                        y: avgTAT,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Avg TAT (days)',
                        yaxis: 'y2',
                        line: { color: '#ef4444', width: 2, dash: 'dot', shape: 'spline' },
                        marker: { size: 5, symbol: 'diamond' },
                    },
                ]}
                layout={{
                    xaxis: {
                        gridcolor: 'rgba(255,255,255,0.04)',
                        tickfont: { color: '#94a3b8', size: 11 },
                        linecolor: 'rgba(255,255,255,0.06)',
                    },
                    yaxis: {
                        title: { text: 'Applications', font: { color: '#94a3b8', size: 11 } },
                        gridcolor: 'rgba(255,255,255,0.04)',
                        tickfont: { color: '#94a3b8', size: 10 },
                        linecolor: 'rgba(255,255,255,0.06)',
                    },
                    yaxis2: {
                        title: { text: 'TAT (days)', font: { color: '#ef4444', size: 11 } },
                        overlaying: 'y',
                        side: 'right',
                        gridcolor: 'transparent',
                        tickfont: { color: '#ef4444', size: 10 },
                        range: [0, 6],
                    },
                    showlegend: true,
                    legend: {
                        x: 0.5,
                        y: -0.2,
                        xanchor: 'center',
                        orientation: 'h',
                        font: { color: '#94a3b8', size: 10 },
                    },
                    margin: { t: 20, r: 60, l: 50, b: 60 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#fff', family: 'Inter, sans-serif' },
                    autosize: true,
                    height: 320,
                    hovermode: 'x unified',
                }}
                useResizeHandler
                style={{ width: '100%' }}
                config={{ displayModeBar: false }}
            />
        </div>
    );
};

export default TrendChart;
