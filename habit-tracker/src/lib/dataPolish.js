const METRIC_CONFIG = {
  mood: {
    label: "Mood",
    unit: "/10",
    decimals: 1,
    min: 1,
    max: 10,
    qualitative: [
      { max: 3.9, label: "Low" },
      { max: 6.4, label: "Okay" },
      { max: 8.4, label: "Good" },
      { max: 10, label: "Excellent" },
    ],
  },
  sleep: {
    label: "Sleep",
    unit: "h",
    decimals: 1,
    min: 0,
    max: 12,
    qualitative: [
      { max: 5.9, label: "Low" },
      { max: 6.9, label: "Fair" },
      { max: 8.4, label: "Good" },
      { max: 12, label: "Strong" },
    ],
  },
  stress: {
    label: "Stress",
    unit: "/10",
    decimals: 1,
    min: 0,
    max: 10,
    qualitative: [
      { max: 3.4, label: "Low" },
      { max: 6.4, label: "Moderate" },
      { max: 8, label: "High" },
      { max: 10, label: "Very high" },
    ],
  },
  study: {
    label: "Study",
    unit: "h",
    decimals: 1,
    min: 0,
    max: 16,
    qualitative: [
      { max: 0.9, label: "Low" },
      { max: 2.9, label: "Steady" },
      { max: 5.4, label: "Focused" },
      { max: 16, label: "Intense" },
    ],
  },
  workout: {
    label: "Workout",
    unit: "min",
    decimals: 0,
    min: 0,
    max: 180,
    qualitative: [
      { max: 0, label: "None" },
      { max: 19, label: "Light" },
      { max: 49, label: "Active" },
      { max: 180, label: "Strong" },
    ],
  },
  water: {
    label: "Water",
    unit: "L",
    decimals: 1,
    min: 0,
    max: 6,
    qualitative: [
      { max: 1.4, label: "Low" },
      { max: 2.4, label: "Good" },
      { max: 3.4, label: "Hydrated" },
      { max: 6, label: "High" },
    ],
  },
  focus: {
    label: "Focus",
    unit: "/5",
    decimals: 1,
    min: 1,
    max: 5,
    qualitative: [
      { max: 2.4, label: "Low" },
      { max: 3.4, label: "Stable" },
      { max: 4.2, label: "Strong" },
      { max: 5, label: "Excellent" },
    ],
  },
  screenTime: {
    label: "Screen time",
    unit: "h",
    decimals: 1,
    min: 0,
    max: 16,
    qualitative: [
      { max: 3.4, label: "Low" },
      { max: 5.4, label: "Moderate" },
      { max: 8, label: "High" },
      { max: 16, label: "Very high" },
    ],
  },
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getMetricConfig(metric) {
  return METRIC_CONFIG[metric] || null;
}

export function formatMetricValue(metric, value, fallback = "N/A") {
  const config = getMetricConfig(metric);
  const numeric = toNumber(value);

  if (numeric === null) {
    return fallback;
  }

  const decimals = config?.decimals ?? 1;
  const unit = config?.unit || "";
  return `${numeric.toFixed(decimals)}${unit}`;
}

export function formatPercent(value, decimals = 0) {
  const numeric = toNumber(value);
  if (numeric === null) {
    return "N/A";
  }

  return `${numeric.toFixed(decimals)}%`;
}

export function formatCorrelationPercent(value) {
  const numeric = toNumber(value);
  if (numeric === null) {
    return "N/A";
  }

  const percent = numeric * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(0)}%`;
}

export function normalizeMetricValue(metric, value) {
  const numeric = toNumber(value);
  const config = getMetricConfig(metric);

  if (numeric === null || !config) {
    return null;
  }

  const range = config.max - config.min;
  if (!range) {
    return 0;
  }

  return Math.max(0, Math.min(1, (numeric - config.min) / range));
}

export function getSmartLabel(metric, value) {
  const numeric = toNumber(value);
  const config = getMetricConfig(metric);

  if (numeric === null || !config?.qualitative) {
    return "No data";
  }

  const hit = config.qualitative.find((item) => numeric <= item.max);
  return hit?.label || "Unknown";
}

export function computeRollingAverageSeries(logs, windowSize = 7) {
  if (!Array.isArray(logs) || !logs.length) {
    return [];
  }

  const metrics = ["mood", "sleep", "stress", "study", "workout", "water", "focus", "screenTime"];

  return logs.map((log, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const scope = logs.slice(start, index + 1);

    const averaged = metrics.reduce((acc, metric) => {
      const values = scope
        .map((item) => toNumber(item[metric]))
        .filter((value) => value !== null);

      if (!values.length) {
        acc[metric] = null;
        return acc;
      }

      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      acc[metric] = Number(avg.toFixed(2));
      return acc;
    }, {});

    return {
      ...log,
      ...averaged,
      source: "rolling-7d",
    };
  });
}

export function getConsistencyIndicator(stdDev, lowerIsBetter = true) {
  const numeric = toNumber(stdDev);
  if (numeric === null) {
    return { label: "Unknown", tone: "neutral" };
  }

  const score = lowerIsBetter ? numeric : -numeric;

  if (score <= 0.75) {
    return { label: "Highly consistent", tone: "good" };
  }

  if (score <= 1.5) {
    return { label: "Moderately consistent", tone: "neutral" };
  }

  return { label: "Variable", tone: "bad" };
}

export function getTimeContextLabel(dateRange, logCount) {
  const countText = `${logCount} ${logCount === 1 ? "entry" : "entries"}`;

  if (dateRange === "7d") {
    return `Last 7 days · ${countText}`;
  }

  if (dateRange === "30d") {
    return `Last 30 days · ${countText}`;
  }

  return `All time · ${countText}`;
}
