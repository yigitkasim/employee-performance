"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const RADAR_SCALE = {
  suggestedMin: 0,
  suggestedMax: 5,
  grid: { color: "#e2e8f0" },
  angleLines: { color: "#e2e8f0" },
};

export type RadarDataset = {
  data: number[];
  color: string;
  fill: string;
  dashed?: boolean;
  pointRadius?: number;
};

export function RadarChart({
  labels,
  datasets,
  height = 300,
  showPointLabels = true,
  pointLabelSize = 10,
  showTicks = false,
}: {
  labels: string[];
  datasets: RadarDataset[];
  height?: number;
  showPointLabels?: boolean;
  pointLabelSize?: number;
  showTicks?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "radar",
      data: {
        labels,
        datasets: datasets.map((d) => ({
          data: d.data,
          backgroundColor: d.fill,
          borderColor: d.color,
          borderWidth: 2,
          borderDash: d.dashed ? [4, 3] : undefined,
          pointBackgroundColor: d.color,
          pointRadius: d.pointRadius ?? 3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            ...RADAR_SCALE,
            ticks: {
              stepSize: 1,
              display: showTicks,
              color: "#94a3b8",
              backdropColor: "transparent",
            },
            pointLabels: showPointLabels
              ? { font: { size: pointLabelSize }, color: "#475569" }
              : { display: false },
          },
        },
      },
    });
    chartRef.current = chart;
    const t = setTimeout(() => chart.resize(), 50);

    return () => {
      clearTimeout(t);
      chart.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(labels), JSON.stringify(datasets), height]);

  return (
    <div style={{ position: "relative", height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
