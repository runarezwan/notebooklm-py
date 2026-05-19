'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface EligibilityChartProps {
    incomeLimit: number;
    assetLimit: number;
    finalLimit: number;
}

const EligibilityChart: React.FC<EligibilityChartProps> = ({ incomeLimit, finalLimit }) => {
    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-transparent rounded-2xl p-6">
            <Plot
                data={[
                    {
                        type: "indicator",
                        mode: "gauge+number",
                        value: finalLimit / 100000,
                        title: { text: "Approved Limit (Lac BDT)", font: { size: 18, color: "#1e293b" } },
                        gauge: {
                            axis: { range: [0, 100], tickwidth: 1, tickcolor: "#10b981" },
                            bar: { color: "#10b981" },
                            bgcolor: "rgba(0,0,0,0)",
                            borderwidth: 2,
                            bordercolor: "#e2e8f0",
                            steps: [
                                { range: [0, 50], color: "rgba(0, 0, 0, 0.02)" },
                                { range: [50, 100], color: "rgba(0, 0, 0, 0.05)" },
                            ],
                            threshold: {
                                line: { color: "#ef4444", width: 4 },
                                thickness: 0.75,
                                value: incomeLimit / 100000
                            }
                        },
                        number: { font: { color: "#0f172a" } }
                    }
                ]}
                layout={{
                    width: 400,
                    height: 350,
                    margin: { t: 25, r: 25, l: 25, b: 25 },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    font: { color: "#1e293b", family: "Inter" }
                }}
            />
        </div>
    );
};

export default EligibilityChart;
