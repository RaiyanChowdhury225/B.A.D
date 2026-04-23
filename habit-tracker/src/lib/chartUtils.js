/**
 * Centralized Chart.js configuration and utilities
 * Handles theme colors, responsive options, and common chart settings
 */

export const CHART_COLORS = {
  light: {
    primary: "#2f5f93",
    secondary: "#4d86bc",
    tertiary: "#7db0dd",
    quaternary: "#a8c9ea",
    accent: "#e74c3c",
    text: "#2c3e50",
    grid: "#e0e6ed",
    bg: "#ffffff",
  },
  dark: {
    primary: "#9ac3ea",
    secondary: "#7db0dd",
    tertiary: "#5fa0d4",
    quaternary: "#4a8cd4",
    accent: "#ff6b6b",
    text: "#e8eef5",
    grid: "#3a4a5c",
    bg: "#1a2332",
  },
  lavender: {
    primary: "#7b5fb8",
    secondary: "#9a7ed0",
    tertiary: "#b89ee5",
    quaternary: "#d0beef",
    accent: "#ea580c",
    text: "#3e2f57",
    grid: "#dacdf2",
    bg: "#f7f3ff",
  },
  mint: {
    primary: "#0f766e",
    secondary: "#14b8a6",
    tertiary: "#2dd4bf",
    quaternary: "#99f6e4",
    accent: "#dc2626",
    text: "#0f3d38",
    grid: "#c2ece5",
    bg: "#f3fffd",
  },
  sunset: {
    primary: "#b45309",
    secondary: "#d97706",
    tertiary: "#f59e0b",
    quaternary: "#fdba74",
    accent: "#be123c",
    text: "#552414",
    grid: "#f4d6bc",
    bg: "#fff9f2",
  },
};

const METRIC_LABELS = {
  mood: "Mood",
  sleep: "Sleep",
  stress: "Stress",
  study: "Study",
  workout: "Workout",
  water: "Water Intake",
  focus: "Focus Quality",
  screenTime: "Screen Time",
};

const METRIC_UNITS = {
  mood: "",
  sleep: "h",
  stress: "",
  study: "h",
  workout: "min",
  water: "L",
  focus: "/5",
  screenTime: "h",
};

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getMetricLabel(metric) {
  return METRIC_LABELS[metric] || metric.charAt(0).toUpperCase() + metric.slice(1);
}

export function getMetricUnit(metric) {
  return METRIC_UNITS[metric] || "";
}

export function formatLogTooltipLines(log) {
  const metrics = ["sleep", "mood", "stress", "study", "workout", "water", "focus", "screenTime"];

  return metrics
    .map((metric) => {
      const value = toFiniteNumber(log?.[metric]);
      if (value === null) {
        return null;
      }

      const unit = getMetricUnit(metric);
      return `${getMetricLabel(metric)}: ${value.toFixed(1)}${unit ? ` ${unit}` : ""}`;
    })
    .filter(Boolean);
};

/**
 * Base Chart.js options for all charts
 * @param {string} theme - 'light' or 'dark'
 * @param {string} title - Chart title
 * @returns {object} Chart configuration object
 */
export function getBaseChartOptions(theme = "light", title = "") {
  const colors = CHART_COLORS[theme] || CHART_COLORS.light;

  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: colors.text,
          font: { size: 12, family: "'Nunito', sans-serif", weight: "600" },
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: !!title,
        text: title,
        color: colors.text,
        font: { size: 14, family: "'Nunito', sans-serif", weight: "700" },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: colors.primary,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = typeof context.parsed.y === "number" 
              ? context.parsed.y.toFixed(1) 
              : context.parsed;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.text,
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: `${colors.grid}40`,
          drawBorder: false,
        },
      },
      y: {
        ticks: {
          color: colors.text,
          font: { size: 11 },
        },
        grid: {
          color: `${colors.grid}40`,
          drawBorder: false,
        },
      },
    },
  };
}

/**
 * Get dataset styling for a specific chart
 * @param {string} theme - 'light' or 'dark'
 * @param {string} type - 'mood', 'sleep', 'stress', 'study', 'anomaly'
 * @returns {object} Dataset configuration (borderColor, backgroundColor, etc.)
 */
export function getDatasetStyle(theme = "light", type = "mood") {
  const colors = CHART_COLORS[theme] || CHART_COLORS.light;

  const styles = {
    mood: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}20`,
      pointBackgroundColor: colors.primary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.primary,
    },
    sleep: {
      borderColor: colors.secondary,
      backgroundColor: `${colors.secondary}20`,
      pointBackgroundColor: colors.secondary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.secondary,
    },
    stress: {
      borderColor: colors.tertiary,
      backgroundColor: `${colors.tertiary}20`,
      pointBackgroundColor: colors.tertiary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.tertiary,
    },
    study: {
      borderColor: colors.quaternary,
      backgroundColor: `${colors.quaternary}20`,
      pointBackgroundColor: colors.quaternary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.quaternary,
    },
    workout: {
      borderColor: colors.secondary,
      backgroundColor: `${colors.secondary}20`,
      pointBackgroundColor: colors.secondary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.secondary,
    },
    water: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}18`,
      pointBackgroundColor: colors.primary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.primary,
    },
    focus: {
      borderColor: colors.quaternary,
      backgroundColor: `${colors.quaternary}20`,
      pointBackgroundColor: colors.quaternary,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.quaternary,
    },
    screenTime: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}20`,
      pointBackgroundColor: colors.accent,
      pointBorderColor: colors.bg,
      pointHoverBackgroundColor: colors.accent,
    },
    anomaly: {
      borderColor: colors.accent,
      backgroundColor: `${colors.accent}20`,
      pointBackgroundColor: colors.accent,
      pointBorderColor: colors.bg,
    },
  };

  return styles[type] || styles.mood;
}

/**
 * Format logs for scatter plot (2D correlation analysis)
 * @param {array} logs - Raw logs array
 * @param {string} xKey - X-axis key ('sleep', 'stress', 'study')
 * @param {string} yKey - Y-axis key (usually 'mood')
 * @returns {array} Formatted points for scatter chart
 */
export function formatScatterData(logs, xKey, yKey) {
  return logs
    .map((log) => {
      const x = toFiniteNumber(log[xKey]);
      const y = toFiniteNumber(log[yKey]);

      if (x === null || y === null) {
        return null;
      }

      return {
        x,
        y,
        meta: log,
      };
    })
    .filter(Boolean);
}

/**
 * Format logs for bar chart aggregation (by week)
 * @param {array} logs - Raw logs array
 * @param {string} groupBy - 'week' or 'weekday'
 * @returns {object} { labels, datasets }
 */
export function formatAggregateData(logs, groupBy = "week", metric = "mood") {
  if (!logs.length) {
    return { labels: [], datasets: [] };
  }

  if (groupBy === "week") {
    const byWeek = {};
    logs.forEach((log) => {
      const date = new Date(log.timestamp || log.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!byWeek[weekKey]) {
        byWeek[weekKey] = [];
      }
      byWeek[weekKey].push(log);
    });

    const labels = Object.keys(byWeek).sort().map((week) => `Week of ${week}`);
    const data = Object.values(byWeek).map((week) => {
      const values = week.map((log) => toFiniteNumber(log[metric])).filter((value) => value !== null);
      if (!values.length) {
        return 0;
      }

      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      return Number(avg.toFixed(1));
    });

    return { labels, datasets: [{ label: `Avg ${getMetricLabel(metric)}`, data }] };
  }

  if (groupBy === "weekday") {
    const byWeekday = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    logs.forEach((log) => {
      const date = new Date(log.timestamp || log.date);
      const day = date.getDay();
      byWeekday[day].push(log);
    });

    const labels = dayNames;
    const data = dayNames.map((_, index) => {
      const dayLogs = byWeekday[index];
      if (!dayLogs.length) return 0;
      const values = dayLogs.map((log) => toFiniteNumber(log[metric])).filter((value) => value !== null);
      if (!values.length) {
        return 0;
      }

      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      return Number(avg.toFixed(1));
    });

    return { labels, datasets: [{ label: `Avg ${getMetricLabel(metric)} by Weekday`, data }] };
  }

  return { labels: [], datasets: [] };
}

export function formatHistogramData(logs, metric = "sleep", bins = 6) {
  const values = logs.map((log) => toFiniteNumber(log[metric])).filter((value) => value !== null);

  if (!values.length) {
    return { labels: [], datasets: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = range / bins;
  const counts = new Array(bins).fill(0);

  values.forEach((value) => {
    let index = Math.floor((value - min) / step);
    if (index >= bins) {
      index = bins - 1;
    }
    counts[index] += 1;
  });

  const labels = counts.map((_, index) => {
    const start = min + step * index;
    const end = start + step;
    return `${start.toFixed(1)}-${end.toFixed(1)}`;
  });

  return {
    labels,
    datasets: [
      {
        label: `${getMetricLabel(metric)} distribution`,
        data: counts,
      },
    ],
  };
}

/**
 * Generate heatmap-style data (mood intensity per day as colors)
 * @param {array} logs - Raw logs array
 * @returns {array} Formatted for heatmap visualization
 */
export function formatHeatmapData(logs, metric = "mood") {
  if (!logs.length) return [];

  return logs.map((log) => ({
    date: log.date || new Date(log.timestamp).toISOString().slice(0, 10),
    timestamp: log.timestamp,
    value: toFiniteNumber(log[metric]),
    label: log.date || new Date(log.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
}
