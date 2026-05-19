'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface RadarChartProps {
    incomeLimit: number;
    assetLimit: number;
    finalLimit: number;
    income: number;
    tenure: number;
    rate: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ incomeLimit, assetLimit, finalLimit, income, tenure, rate }) => {
    // Normalize values to 0-100 scale for radar comparison
    const incomeScore = Math.min((income / 500000) * 100, 100);
    const assetScore = Math.min((assetLimit / 5000000) * 100, 100);
    const tenureScore = (tenure / 25) * 100;
    const rateScore = 100 - ((rate - 8) / 10) * 100; // Lower rate = higher score
    const dtiScore = Math.min((finalLimit / incomeLimit) * 100, 100);
    const creditScore = 78; // Simulated credit score

    const categories = ['Income Strength', 'Asset Coverage', 'Tenure Fit', 'Rate Advantage', 'DTI Ratio', 'Credit Score'];
    const values = [incomeScore, assetScore, tenureScore, rateScore, dtiScore, creditScore];

    return (
        <div className="w-full bg-transparent p-4">
            <Plot
                data={[
                    {
                        type: 'scatterpolar',
                        r: [...values, values[0]], // Close the polygon
                        theta: [...categories, categories[0]],
                        fill: 'toself',
                        fillcolor: 'rgba(16, 185, 129, 0.15)',
                        line: { color: '#10b981', width: 2 },
                        marker: { color: '#10b981', size: 6 },
                        name: 'Applicant Profile',
                    },
                    {
                        type: 'scatterpolar',
                        r: [80, 70, 60, 75, 65, 85, 80], // Benchmark
                        theta: [...categories, categories[0]],
                        fill: 'toself',
                        fillcolor: 'rgba(13, 148, 136, 0.08)',
                        line: { color: '#0d9488', width: 1.5, dash: 'dot' },
                        marker: { size: 0 },
                        name: 'CRM Benchmark',
                    },
                ]}
                layout={{
                    polar: {
                        radialaxis: {
                            visible: true,
                            range: [0, 100],
                            showticklabels: false,
                            gridcolor: 'rgba(0,0,0,0.06)',
                            linecolor: 'rgba(0,0,0,0.06)',
                        },
                        angularaxis: {
                            gridcolor: 'rgba(0,0,0,0.06)',
                            linecolor: 'rgba(0,0,0,0.06)',
                            tickfont: { color: '#475569', size: 11 },
                        },
                        bgcolor: 'rgba(0,0,0,0)',
                    },
                    showlegend: true,
                    legend: {
                        x: 0.5,
                        y: -0.15,
                        xanchor: 'center',
                        orientation: 'h',
                        font: { color: '#475569', size: 11 },
                    },
                    margin: { t: 30, r: 40, l: 40, b: 50 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#1e293b', family: 'Inter, sans-serif' },
                    autosize: true,
                    height: 340,
                }}
                useResizeHandler
                style={{ width: '100%' }}
                config={{ displayModeBar: false }}
            />
        </div>
    );
};

export default RadarChart;
