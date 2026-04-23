import { useEffect, useMemo, useState } from "react";
import { analyzeHabitData } from "../lib/habitAnalytics";
import { getTimeContextLabel } from "../lib/dataPolish";

const RANGE_MS = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const METRIC_LABELS = {
  mood: "Mood",
  sleep: "Sleep",
  stress: "Stress",
  study: "Study",
  workout: "Workout",
  water: "Water",
  focus: "Focus",
  screenTime: "Screen time",
};

function getLogTime(log) {
  if (typeof log.timestamp === "number") {
    return log.timestamp;
  }

  if (log.date) {
    const parsed = Date.parse(`${log.date}T12:00:00`);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function getRangeLabel(range) {
  if (range === "7d") {
    return "last 7 days";
  }

  if (range === "30d") {
    return "last 30 days";
  }

  return "all time";
}

function getLabel(metric) {
  return METRIC_LABELS[metric] || metric;
}

export function useInteractiveAnalytics(logs, goals) {
  const [dateRange, setDateRange] = useState("all");
  const [metricToggles, setMetricToggles] = useState({
    mood: true,
    sleep: true,
    stress: true,
    study: true,
    workout: true,
    water: true,
    focus: true,
    screenTime: true,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [hoveredLogId, setHoveredLogId] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [qualityAlertShown, setQualityAlertShown] = useState(false);

  const filteredLogs = useMemo(() => {
    const sorted = [...logs].sort((left, right) => getLogTime(left) - getLogTime(right));

    if (dateRange === "all" || !sorted.length) {
      return sorted;
    }

    const latest = getLogTime(sorted[sorted.length - 1]);
    const threshold = latest - RANGE_MS[dateRange];
    return sorted.filter((log) => getLogTime(log) >= threshold);
  }, [logs, dateRange]);

  const analytics = useMemo(() => analyzeHabitData(filteredLogs, goals), [filteredLogs, goals]);

  const qualitySummary = useMemo(() => {
    const quality = analytics.dataQuality;
    if (!quality) {
      return {
        label: "Unknown",
        tone: "slate",
        note: "Quality score unavailable.",
      };
    }

    if (quality.score >= 80) {
      return {
        label: "High confidence",
        tone: "blue",
        note: "Insights are supported by dense and recent logging.",
      };
    }

    if (quality.score >= 60) {
      return {
        label: "Moderate confidence",
        tone: "indigo",
        note: "Most insights are reliable, with a few consistency gaps.",
      };
    }

    if (quality.score >= 40) {
      return {
        label: "Low confidence",
        tone: "slate",
        note: "Patterns are directional but need more regular logs.",
      };
    }

    return {
      label: "Very low confidence",
      tone: "navy",
      note: "Add more recent and consistent logs before trusting trends.",
    };
  }, [analytics.dataQuality]);

  const goalFeedback = useMemo(() => analytics.goalProgress?.feedback || [], [analytics.goalProgress]);

  const timeContextLabel = useMemo(
    () => getTimeContextLabel(dateRange, filteredLogs.length),
    [dateRange, filteredLogs.length]
  );

  const bestSleepThreshold = useMemo(() => {
    if (!filteredLogs.length) return 0;
    const maxSleep = Math.max(...filteredLogs.map((item) => Number(item.sleep || 0)));
    return maxSleep * 0.85;
  }, [filteredLogs]);

  const highStressThreshold = useMemo(() => {
    if (!filteredLogs.length) return 0;
    const maxStress = Math.max(...filteredLogs.map((item) => Number(item.stress || 0)));
    return maxStress * 0.8;
  }, [filteredLogs]);

  const dynamicInsights = useMemo(() => {
    const lines = [];
    const engineInsights = analytics.insightEngine?.computedInsights || [];

    if (engineInsights.length) {
      lines.push(...engineInsights.slice(0, 2));
    }

    const rankedCorrelations = [
      { key: "sleepMood", label: "Sleep", value: analytics.correlations.sleepMood },
      { key: "stressMood", label: "Stress", value: analytics.correlations.stressMood },
      { key: "studyMood", label: "Study", value: analytics.correlations.studyMood },
      { key: "workoutMood", label: "Workout", value: analytics.correlations.workoutMood },
      { key: "waterMood", label: "Water", value: analytics.correlations.waterMood },
      { key: "focusMood", label: "Focus", value: analytics.correlations.focusMood },
      { key: "screenTimeMood", label: "Screen time", value: analytics.correlations.screenTimeMood },
    ]
      .filter((item) => metricToggles[item.key.replace("Mood", "")])
      .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));

    if (rankedCorrelations.length > 0) {
      const strongest = rankedCorrelations[0];
      const direction = strongest.value >= 0 ? "positive" : "negative";
      if (!engineInsights.length) {
        lines.push(`Right now, ${strongest.label.toLowerCase()} seems to have the clearest ${direction} tie to mood.`);
      }
    }

    if (metricToggles.stress && metricToggles.mood && filteredLogs.length > 2) {
      const worstMoodDay = [...filteredLogs].sort((left, right) => Number(left.mood || 0) - Number(right.mood || 0))[0];
      if (Number(worstMoodDay.stress || 0) >= highStressThreshold) {
        lines.push("Your lower-mood days are still clustering around higher stress.");
      }
    }

    if (metricToggles.workout && metricToggles.mood && analytics.correlations.workoutMood > 0.2) {
      lines.push("Your workout days are trending toward better mood.");
    }

    if (selectedLog) {
      lines.push(`Quick look at ${selectedLog.date || "this day"}: mood ${Number(selectedLog.mood || 0).toFixed(1)}.`);
    }

    if (!lines.length) {
      lines.push("Adjust filters or metric toggles to reveal stronger patterns.");
    }

    return lines;
  }, [analytics.correlations, analytics.insightEngine, filteredLogs, highStressThreshold, metricToggles, selectedLog]);

  const setRange = (range) => {
    setDateRange(range);
    setIsFiltering(true);
    setToastMessage(`Data updated for ${getRangeLabel(range)}.`);
  };

  const toggleMetric = (metric) => {
    setMetricToggles((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length;
      if (enabledCount === 1 && current[metric]) {
        return current;
      }

      return {
        ...current,
        [metric]: !current[metric],
      };
    });

    setIsFiltering(true);
    setActiveMetric(metric);
    setToastMessage(`${getLabel(metric)} visibility updated.`);
  };

  useEffect(() => {
    if (!isFiltering) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsFiltering(false);
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [isFiltering]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    const quality = analytics.dataQuality;
    if (!quality || quality.score >= 40 || qualityAlertShown) {
      return;
    }

    setToastMessage("Data confidence is low. Insights may be noisy until more logs are added.");
    setQualityAlertShown(true);
  }, [analytics.dataQuality, qualityAlertShown]);

  useEffect(() => {
    if (!selectedLog) {
      return;
    }

    const stillVisible = filteredLogs.some((log) => log.id === selectedLog.id);
    if (!stillVisible) {
      setSelectedLog(null);
    }
  }, [filteredLogs, selectedLog]);

  return {
    dateRange,
    setRange,
    metricToggles,
    toggleMetric,
    filteredLogs,
    analytics,
    selectedLog,
    setSelectedLog,
    hoveredLogId,
    setHoveredLogId,
    activeMetric,
    setActiveMetric,
    bestSleepThreshold,
    highStressThreshold,
    dynamicInsights,
    isFiltering,
    toastMessage,
    setToastMessage,
    qualitySummary,
    goalFeedback,
    timeContextLabel,
  };
}
