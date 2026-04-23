import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,   
  Title,            
  Tooltip,          
  Legend            
} from "chart.js";

import { Line } from "react-chartjs-2";
import ChartCard from "./ChartCard";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
  Title,
  Tooltip,
  Legend
);

function StatsChart({ series = [], theme = "light" }) {
  const labels = series.map((item) => item.label);
  const isDark = theme === "dark";

  const data = {
    labels,
    datasets: [
      {
        label: "Mood rolling avg",
        data: series.map((item) => item.mood),
        borderColor: isDark ? "#9ac3ea" : "#2f5f93",
        backgroundColor: isDark ? "rgba(154, 195, 234, 0.18)" : "rgba(47, 95, 147, 0.16)",
        borderWidth: 2.5,
        pointRadius: 2.5,
        tension: 0.35,
        fill: false,
      },
      {
        label: "Sleep rolling avg",
        data: series.map((item) => item.sleep),
        borderColor: isDark ? "#7db0dd" : "#4d86bc",
        backgroundColor: isDark ? "rgba(125, 176, 221, 0.18)" : "rgba(77, 134, 188, 0.15)",
        borderWidth: 2.5,
        pointRadius: 2.5,
        tension: 0.35,
        fill: false,
      },
      {
        label: "Stress rolling avg",
        data: series.map((item) => item.stress),
        borderColor: isDark ? "#b3cbe3" : "#86aecd",
        backgroundColor: isDark ? "rgba(179, 203, 227, 0.16)" : "rgba(134, 174, 205, 0.16)",
        borderWidth: 2.5,
        pointRadius: 2.5,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const labelColor = isDark ? "rgba(226, 236, 247, 0.8)" : "rgba(28, 56, 86, 0.8)";
  const gridColor = isDark ? "rgba(154, 195, 234, 0.12)" : "rgba(98, 142, 181, 0.14)";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 650,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        labels: {
          color: labelColor,
          boxWidth: 12,
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(19, 34, 52, 0.96)" : "rgba(255, 255, 255, 0.96)",
        titleColor: isDark ? "#f4f8fc" : "#17344d",
        bodyColor: isDark ? "#e6f0fa" : "#17344d",
        borderColor: isDark ? "rgba(154, 195, 234, 0.2)" : "rgba(125, 174, 216, 0.25)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: labelColor },
        grid: { color: gridColor },
      },
      y: {
        ticks: { color: labelColor },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <ChartCard eyebrow="Trends" title="Rolling trend lines" description="A smoother read on the overall habit direction.">
      {series.length > 0 ? (
        <div className="chart-canvas-wrap">
          <Line data={data} options={options} />
        </div>
      ) : (
        <p className="empty-state">No data yet. Add a log to see the trend lines.</p>
      )}
    </ChartCard>
  );
}

export default StatsChart