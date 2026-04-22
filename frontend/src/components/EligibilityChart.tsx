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
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white/5 rounded-2xl p-6 backdrop-blur-md border border-white/10 shadow-2xl">
            <Plot
                data={[
                    {
                        type: "indicator",
                        mode: "gauge+number",
                        value: finalLimit / 100000,
                        title: { text: "Approved Limit (Lac BDT)", font: { size: 18, color: "#fff" } },
                        gauge: {
                            axis: { range: [0, 100], tickwidth: 1, tickcolor: "#f7b217" },
                            bar: { color: "#f7b217" },
                            bgcolor: "rgba(0,0,0,0)",
                            borderwidth: 2,
                            bordercolor: "#444",
                            steps: [
                                { range: [0, 50], color: "rgba(255, 255, 255, 0.05)" },
                                { range: [50, 100], color: "rgba(255, 255, 255, 0.1)" },
                            ],
                            threshold: {
                                line: { color: "red", width: 4 },
                                thickness: 0.75,
                                value: incomeLimit / 100000
                            }
                        },
                        number: { font: { color: "#fff" } }
                    }
                ]}
                layout={{
                    width: 400,
                    height: 350,
                    margin: { t: 25, r: 25, l: 25, b: 25 },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    font: { color: "#fff", family: "Inter" }
                }}
            />
        </div>
    );
};

export default EligibilityChart;
