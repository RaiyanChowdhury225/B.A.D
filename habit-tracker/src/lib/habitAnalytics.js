const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const METRICS = ["sleep", "study", "mood", "stress", "workout", "water", "focus", "screenTime"];
const MOOD_RELATIONSHIPS = [
  ["sleepMood", "sleep", "mood", "Sleep"],
  ["stressMood", "stress", "mood", "Stress"],
  ["studyMood", "study", "mood", "Study"],
  ["workoutMood", "workout", "mood", "Workout"],
  ["waterMood", "water", "mood", "Water"],
  ["focusMood", "focus", "mood", "Focus"],
  ["screenTimeMood", "screenTime", "mood", "Screen time"],
];

const RELATIONSHIP_CANDIDATES = [
  { key: "sleepMood", x: "sleep", y: "mood", label: "Sleep vs Mood" },
  { key: "stressMood", x: "stress", y: "mood", label: "Stress vs Mood" },
  { key: "studyMood", x: "study", y: "mood", label: "Study vs Mood" },
  { key: "workoutMood", x: "workout", y: "mood", label: "Workout vs Mood" },
  { key: "waterFocus", x: "water", y: "focus", label: "Water vs Focus" },
  { key: "screenTimeFocus", x: "screenTime", y: "focus", label: "Screen Time vs Focus" },
  { key: "sleepStress", x: "sleep", y: "stress", label: "Sleep vs Stress" },
  { key: "screenTimeMood", x: "screenTime", y: "mood", label: "Screen Time vs Mood" },
];

const RULE_CONFIG = {
  sleepLowRiskThreshold: 6,
  screenTimeHighThreshold: 5,
  stressHighThreshold: 7,
  workoutMeaningfulMinutes: 20,
  sleepBoostThreshold: 7,
};

const QUALITY_CONFIG = {
  recentWindowDays: 30,
  logsWeight: 0.35,
  consistencyWeight: 0.4,
  recencyWeight: 0.25,
};

const DEFAULT_GOALS = {
  sleepHoursPerDay: 8,
  studyHoursPerDay: 2,
  workoutTimesPerWeek: 3,
};

const PREDICTION_CONFIG = {
  lookbackDays: 7,
  lowSleepThreshold: 6,
  highStressThreshold: 7,
  workoutMeaningfulMinutes: 20,
};

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function toDateOnly(log) {
  if (typeof log?.date === "string" && log.date) {
    return log.date;
  }

  const time = getLogTime(log);
  if (!time) {
    return null;
  }

  return new Date(time).toISOString().slice(0, 10);
}

function dateToUtcDay(dateString) {
  if (!dateString) {
    return null;
  }

  const parsed = Date.parse(`${dateString}T00:00:00Z`);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.floor(parsed / DAY_MS);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeGoals(goals = {}) {
  const sleep = Number(goals.sleepHoursPerDay);
  const study = Number(goals.studyHoursPerDay);
  const workout = Number(goals.workoutTimesPerWeek);

  return {
    sleepHoursPerDay: Number.isFinite(sleep) && sleep > 0 ? sleep : DEFAULT_GOALS.sleepHoursPerDay,
    studyHoursPerDay: Number.isFinite(study) && study > 0 ? study : DEFAULT_GOALS.studyHoursPerDay,
    workoutTimesPerWeek: Number.isFinite(workout) && workout > 0 ? workout : DEFAULT_GOALS.workoutTimesPerWeek,
  };
}

function sortLogs(logs) {
  return [...logs].sort((left, right) => getLogTime(left) - getLogTime(right));
}

function average(logs, key) {
  const values = logs.map((item) => toFiniteNumber(item[key])).filter((value) => value !== null);

  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(logs, key) {
  const values = logs.map((item) => toFiniteNumber(item[key])).filter((value) => value !== null);

  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => {
    const diff = value - mean;
    return sum + diff * diff;
  }, 0) / values.length;

  return Math.sqrt(variance);
}

function pearsonCorrelation(logs, xKey, yKey) {
  const pairs = logs
    .map((log) => ({ x: toFiniteNumber(log[xKey]), y: toFiniteNumber(log[yKey]) }))
    .filter((pair) => pair.x !== null && pair.y !== null);

  if (pairs.length < 2) {
    return 0;
  }

  const xValues = pairs.map((pair) => pair.x);
  const yValues = pairs.map((pair) => pair.y);
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let index = 0; index < pairs.length; index += 1) {
    const xDistance = xValues[index] - xMean;
    const yDistance = yValues[index] - yMean;
    numerator += xDistance * yDistance;
    xVariance += xDistance * xDistance;
    yVariance += yDistance * yDistance;
  }

  const denominator = Math.sqrt(xVariance * yVariance);
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

function getCorrelationStats(logs, xKey, yKey) {
  const pairs = logs
    .map((log) => ({ x: toFiniteNumber(log[xKey]), y: toFiniteNumber(log[yKey]) }))
    .filter((pair) => pair.x !== null && pair.y !== null);

  if (pairs.length < 2) {
    return {
      correlation: 0,
      pairCount: pairs.length,
      coverage: 0,
      score: 0,
    };
  }

  const correlation = pearsonCorrelation(logs, xKey, yKey);
  const coverage = pairs.length / Math.max(logs.length, 1);

  return {
    correlation,
    pairCount: pairs.length,
    coverage,
    // Simple quality score: relationship strength weighted by available data coverage.
    score: Math.abs(correlation) * coverage,
  };
}

function getTrendText(metric, startValue, endValue) {
  const diff = endValue - startValue;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.25) {
    return `Your ${metric} has been fairly steady over the period.`;
  }

  if (metric === "stress") {
    return diff > 0
      ? "Stress levels are slowly increasing over time."
      : "Stress levels are gradually easing over time.";
  }

  if (metric === "sleep") {
    return diff > 0
      ? "Sleep has been improving over the period."
      : "Sleep has been slipping a little over the period.";
  }

  if (metric === "mood") {
    return diff > 0
      ? "Mood is trending upward over time."
      : "Mood is drifting down slightly over time.";
  }

  return diff > 0
    ? `${metric[0].toUpperCase() + metric.slice(1)} is trending upward over time.`
    : `${metric[0].toUpperCase() + metric.slice(1)} is trending downward over time.`;
}

function getWeeklyAverages(logs) {
  const sortedLogs = sortLogs(logs);

  if (!sortedLogs.length) {
    return {};
  }

  const firstLogTime = getLogTime(sortedLogs[0]);
  const buckets = {};

  sortedLogs.forEach((log) => {
    const weekNumber = Math.floor((getLogTime(log) - firstLogTime) / WEEK_MS) + 1;
    const weekKey = `Week ${weekNumber}`;

    if (!buckets[weekKey]) {
      buckets[weekKey] = [];
    }

    buckets[weekKey].push(log);
  });

  return Object.fromEntries(
    Object.entries(buckets).map(([weekKey, weekLogs]) => [
      weekKey,
      {
        count: weekLogs.length,
        sleep: average(weekLogs, "sleep"),
        study: average(weekLogs, "study"),
        mood: average(weekLogs, "mood"),
        stress: average(weekLogs, "stress"),
        workout: average(weekLogs, "workout"),
        water: average(weekLogs, "water"),
        focus: average(weekLogs, "focus"),
        screenTime: average(weekLogs, "screenTime"),
      },
    ])
  );
}

function getRollingAverages(logs, windowSize = 7) {
  const sortedLogs = sortLogs(logs);

  return sortedLogs.map((log, index) => {
    const startIndex = Math.max(0, index - windowSize + 1);
    const windowLogs = sortedLogs.slice(startIndex, index + 1);

    return {
      label: log.date || `Entry ${index + 1}`,
      timestamp: getLogTime(log),
      sleep: average(windowLogs, "sleep"),
      study: average(windowLogs, "study"),
      mood: average(windowLogs, "mood"),
      stress: average(windowLogs, "stress"),
      workout: average(windowLogs, "workout"),
      water: average(windowLogs, "water"),
      focus: average(windowLogs, "focus"),
      screenTime: average(windowLogs, "screenTime"),
    };
  });
}

function getAnomalies(logs) {
  if (logs.length < 4) {
    return [];
  }

  const baselines = Object.fromEntries(METRICS.map((metric) => [metric, average(logs, metric)]));
  const deviations = Object.fromEntries(METRICS.map((metric) => [metric, standardDeviation(logs, metric) || 1]));

  return sortLogs(logs)
    .map((log) => {
      const zScores = Object.fromEntries(
        METRICS.map((metric) => {
          const value = toFiniteNumber(log[metric]);
          return [metric, ((value ?? 0) - baselines[metric]) / deviations[metric]];
        })
      );

      const unusualLowMood = zScores.mood <= -1.25;
      const unusualLowSleep = zScores.sleep <= -1;
      const unusualHighStress = zScores.stress >= 1;
      const unusualLowStudy = zScores.study <= -1;

      if (!unusualLowMood && !unusualLowSleep && !unusualHighStress && !unusualLowStudy) {
        return null;
      }

      return {
        date: log.date || "Unknown date",
        message:
          unusualLowMood && unusualHighStress
            ? "This looks like an unusual low-mood day with elevated stress."
            : unusualLowMood && unusualLowSleep
              ? "This looks like an unusual low-mood day with less sleep than usual."
              : unusualLowMood && unusualLowStudy
                ? "This looks like an unusual low-mood day with lower study time than usual."
                : "This day stands out a little compared with your normal pattern.",
      };
    })
    .filter(Boolean)
    .slice(-3);
}

function getDirectionalInsight(correlation, positiveText, negativeText) {
  if (Math.abs(correlation) < 0.2) {
    return "Still early, but this pattern is starting to take shape.";
  }

  return correlation > 0 ? positiveText : negativeText;
}

function buildCorrelationInsights(sortedLogs) {
  const correlations = Object.fromEntries(
    MOOD_RELATIONSHIPS.map(([key, xKey, yKey]) => [key, pearsonCorrelation(sortedLogs, xKey, yKey)])
  );

  const driverRanking = MOOD_RELATIONSHIPS
    .map(([key, , , label]) => ({
      key,
      label,
      value: correlations[key],
      explanation: getDirectionalInsight(
        correlations[key],
        `${label} and mood usually rise together for you.`,
        `${label} tends to move in the opposite direction from mood for you.`
      ),
    }))
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));

  return { correlations, driverRanking };
}

function averageForSubset(logs, metric, predicate) {
  const subset = logs.filter(predicate);
  if (!subset.length) {
    return { average: null, count: 0 };
  }

  const value = average(subset, metric);
  return {
    average: Number.isFinite(value) ? value : null,
    count: subset.length,
  };
}

function buildRuleBasedInsights(sortedLogs) {
  const scoredRelationships = RELATIONSHIP_CANDIDATES.map((candidate) => {
    const stats = getCorrelationStats(sortedLogs, candidate.x, candidate.y);
    return {
      ...candidate,
      ...stats,
    };
  }).sort((left, right) => right.score - left.score);

  const strongestPositive = scoredRelationships
    .filter((item) => item.correlation > 0)
    .sort((left, right) => right.score - left.score)[0] || null;

  const strongestNegative = scoredRelationships
    .filter((item) => item.correlation < 0)
    .sort((left, right) => right.score - left.score)[0] || null;

  const insights = [];

  if (strongestPositive) {
    const confidence = strongestPositive.pairCount >= 6 ? "more consistent" : "an early";
    insights.push(
      `${strongestPositive.label} looks like your clearest mood lift right now (r=${strongestPositive.correlation.toFixed(2)}, ${confidence} signal).`
    );
  }

  if (strongestNegative) {
    const confidence = strongestNegative.pairCount >= 6 ? "more consistent" : "an early";
    insights.push(
      `${strongestNegative.label} looks like your clearest mood drag right now (r=${strongestNegative.correlation.toFixed(2)}, ${confidence} signal).`
    );
  }

  const workoutDays = averageForSubset(
    sortedLogs,
    "mood",
    (log) => (toFiniteNumber(log.workout) ?? 0) >= RULE_CONFIG.workoutMeaningfulMinutes
  );
  const nonWorkoutDays = averageForSubset(
    sortedLogs,
    "mood",
    (log) => (toFiniteNumber(log.workout) ?? 0) < RULE_CONFIG.workoutMeaningfulMinutes
  );
  if (workoutDays.count >= 2 && nonWorkoutDays.count >= 2 && workoutDays.average !== null && nonWorkoutDays.average !== null) {
    const diff = workoutDays.average - nonWorkoutDays.average;
    if (diff >= 0.4) {
      insights.push(`On workout days, your mood is about ${diff.toFixed(1)} points higher.`);
    }
  }

  const lowSleep = averageForSubset(
    sortedLogs,
    "mood",
    (log) => (toFiniteNumber(log.sleep) ?? Number.POSITIVE_INFINITY) < RULE_CONFIG.sleepLowRiskThreshold
  );
  const enoughSleep = averageForSubset(
    sortedLogs,
    "mood",
    (log) => (toFiniteNumber(log.sleep) ?? 0) >= RULE_CONFIG.sleepLowRiskThreshold
  );
  if (lowSleep.count >= 2 && enoughSleep.count >= 2 && lowSleep.average !== null && enoughSleep.average !== null) {
    const moodGap = lowSleep.average - enoughSleep.average;
    if (moodGap <= -0.35) {
      insights.push(
        `When sleep drops below ${RULE_CONFIG.sleepLowRiskThreshold}h, mood tends to dip by about ${Math.abs(moodGap).toFixed(1)} points.`
      );
    }
  }

  const highScreen = averageForSubset(
    sortedLogs,
    "focus",
    (log) => (toFiniteNumber(log.screenTime) ?? 0) > RULE_CONFIG.screenTimeHighThreshold
  );
  const lowScreen = averageForSubset(
    sortedLogs,
    "focus",
    (log) => (toFiniteNumber(log.screenTime) ?? 0) <= RULE_CONFIG.screenTimeHighThreshold
  );
  if (highScreen.count >= 2 && lowScreen.count >= 2 && highScreen.average !== null && lowScreen.average !== null) {
    const focusGap = highScreen.average - lowScreen.average;
    if (focusGap <= -0.3) {
      insights.push(
        `On high screen-time days (over ${RULE_CONFIG.screenTimeHighThreshold}h), focus is about ${Math.abs(
          focusGap
        ).toFixed(1)} points lower.`
      );
    }
  }

  const comboBoost = averageForSubset(
    sortedLogs,
    "mood",
    (log) =>
      (toFiniteNumber(log.sleep) ?? 0) >= RULE_CONFIG.sleepBoostThreshold &&
      (toFiniteNumber(log.workout) ?? 0) >= RULE_CONFIG.workoutMeaningfulMinutes
  );
  const comboOther = averageForSubset(
    sortedLogs,
    "mood",
    (log) =>
      (toFiniteNumber(log.sleep) ?? 0) < RULE_CONFIG.sleepBoostThreshold ||
      (toFiniteNumber(log.workout) ?? 0) < RULE_CONFIG.workoutMeaningfulMinutes
  );
  if (comboBoost.count >= 2 && comboOther.count >= 2 && comboBoost.average !== null && comboOther.average !== null) {
    const comboDiff = comboBoost.average - comboOther.average;
    if (comboDiff >= 0.45) {
      insights.push(`Good sleep plus a workout day is linked to a ${comboDiff.toFixed(1)}-point mood lift.`);
    }
  }

  const comboDrop = averageForSubset(
    sortedLogs,
    "mood",
    (log) =>
      (toFiniteNumber(log.stress) ?? 0) >= RULE_CONFIG.stressHighThreshold &&
      (toFiniteNumber(log.screenTime) ?? 0) > RULE_CONFIG.screenTimeHighThreshold
  );
  const comboSafer = averageForSubset(
    sortedLogs,
    "mood",
    (log) =>
      (toFiniteNumber(log.stress) ?? 0) < RULE_CONFIG.stressHighThreshold ||
      (toFiniteNumber(log.screenTime) ?? 0) <= RULE_CONFIG.screenTimeHighThreshold
  );
  if (comboDrop.count >= 2 && comboSafer.count >= 2 && comboDrop.average !== null && comboSafer.average !== null) {
    const comboGap = comboDrop.average - comboSafer.average;
    if (comboGap <= -0.45) {
      insights.push(
        `High stress together with heavy screen time is linked to a ${Math.abs(comboGap).toFixed(1)}-point mood drop.`
      );
    }
  }

  const sleepVariability = standardDeviation(sortedLogs, "sleep");
  const moodVariability = standardDeviation(sortedLogs, "mood");
  if (sleepVariability > 0 && moodVariability > 0 && sleepVariability <= 1.1) {
    insights.push("Your mood looks steadier when your sleep schedule stays consistent.");
  }

  if (!insights.length) {
    insights.push("You are building a solid baseline. A few more logs will unlock clearer personal patterns.");
  }

  return {
    rules: {
      thresholds: {
        sleepLowRiskThreshold: RULE_CONFIG.sleepLowRiskThreshold,
        screenTimeHighThreshold: RULE_CONFIG.screenTimeHighThreshold,
        stressHighThreshold: RULE_CONFIG.stressHighThreshold,
      },
      multiFactor: {
        moodBoost: {
          sleepAtLeast: RULE_CONFIG.sleepBoostThreshold,
          workoutAtLeastMinutes: RULE_CONFIG.workoutMeaningfulMinutes,
        },
        moodDrop: {
          stressAtLeast: RULE_CONFIG.stressHighThreshold,
          screenTimeAbove: RULE_CONFIG.screenTimeHighThreshold,
        },
      },
    },
    correlationScoring: {
      method: "pearson",
      formula: "score = |r| * coverage",
      details: scoredRelationships,
    },
    strongestPositive,
    strongestNegative,
    computedInsights: insights,
  };
}

function buildKpis(sortedLogs) {
  return {
    avgSleep: average(sortedLogs, "sleep"),
    avgStudy: average(sortedLogs, "study"),
    avgMood: average(sortedLogs, "mood"),
    avgStress: average(sortedLogs, "stress"),
    avgWorkout: average(sortedLogs, "workout"),
    avgWater: average(sortedLogs, "water"),
    avgFocus: average(sortedLogs, "focus"),
    avgScreenTime: average(sortedLogs, "screenTime"),
  };
}

function getRecencyScore(daysSinceLastLog) {
  if (daysSinceLastLog <= 0) return 100;
  if (daysSinceLastLog <= 1) return 95;
  if (daysSinceLastLog <= 3) return 85;
  if (daysSinceLastLog <= 7) return 65;
  if (daysSinceLastLog <= 14) return 35;
  if (daysSinceLastLog <= 30) return 10;
  return 0;
}

function getConfidenceBand(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "low";
  return "very-low";
}

function getDataQualityMetrics(sortedLogs) {
  if (!sortedLogs.length) {
    return {
      score: 0,
      confidenceBand: "very-low",
      components: {
        logs: 0,
        consistency: 0,
        recency: 0,
      },
      missingData: {
        totalExpectedDays: 0,
        loggedDays: 0,
        missingDays: 0,
        missingRate: 0,
        recentWindowDays: QUALITY_CONFIG.recentWindowDays,
        recentExpectedDays: 0,
        recentLoggedDays: 0,
        recentMissingDays: 0,
        recentMissingRate: 0,
        sampleMissingDates: [],
        warning: "No logs yet. Add data to calculate quality.",
      },
      consistency: {
        currentStreak: 0,
        longestStreak: 0,
        irregularGapCount: 0,
        averageGapDays: 0,
        gapStdDev: 0,
        isIrregular: false,
      },
      recency: {
        daysSinceLastLog: null,
        lastLogDate: null,
      },
      warnings: ["No data available for quality analysis yet."],
    };
  }

  const uniqueDateDays = [...new Set(sortedLogs.map((log) => toDateOnly(log)).filter(Boolean))]
    .map(dateToUtcDay)
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

  if (!uniqueDateDays.length) {
    return {
      score: 0,
      confidenceBand: "very-low",
      components: {
        logs: 0,
        consistency: 0,
        recency: 0,
      },
      missingData: {
        totalExpectedDays: 0,
        loggedDays: 0,
        missingDays: 0,
        missingRate: 0,
        recentWindowDays: QUALITY_CONFIG.recentWindowDays,
        recentExpectedDays: 0,
        recentLoggedDays: 0,
        recentMissingDays: 0,
        recentMissingRate: 0,
        sampleMissingDates: [],
        warning: "Could not parse log dates for quality checks.",
      },
      consistency: {
        currentStreak: 0,
        longestStreak: 0,
        irregularGapCount: 0,
        averageGapDays: 0,
        gapStdDev: 0,
        isIrregular: true,
      },
      recency: {
        daysSinceLastLog: null,
        lastLogDate: null,
      },
      warnings: ["Date parsing issue detected in logs."],
    };
  }

  const firstDay = uniqueDateDays[0];
  const lastDay = uniqueDateDays[uniqueDateDays.length - 1];
  const totalExpectedDays = lastDay - firstDay + 1;
  const loggedDays = uniqueDateDays.length;
  const missingDays = Math.max(0, totalExpectedDays - loggedDays);
  const missingRate = totalExpectedDays ? missingDays / totalExpectedDays : 0;

  const missingDaySet = new Set(uniqueDateDays);
  const sampleMissingDates = [];
  for (let day = firstDay; day <= lastDay; day += 1) {
    if (!missingDaySet.has(day)) {
      sampleMissingDates.push(new Date(day * DAY_MS).toISOString().slice(0, 10));
    }
  }

  const recentWindowDays = QUALITY_CONFIG.recentWindowDays;
  const recentStartDay = Math.max(firstDay, lastDay - recentWindowDays + 1);
  const recentExpectedDays = lastDay - recentStartDay + 1;
  const recentLoggedDays = uniqueDateDays.filter((day) => day >= recentStartDay).length;
  const recentMissingDays = Math.max(0, recentExpectedDays - recentLoggedDays);
  const recentMissingRate = recentExpectedDays ? recentMissingDays / recentExpectedDays : 0;

  let currentStreak = 1;
  for (let index = uniqueDateDays.length - 1; index > 0; index -= 1) {
    const gap = uniqueDateDays[index] - uniqueDateDays[index - 1];
    if (gap === 1) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  let longestStreak = 1;
  let runningStreak = 1;
  const gapSizes = [];

  for (let index = 1; index < uniqueDateDays.length; index += 1) {
    const gap = uniqueDateDays[index] - uniqueDateDays[index - 1];
    gapSizes.push(gap);

    if (gap === 1) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  const averageGapDays = gapSizes.length
    ? gapSizes.reduce((sum, value) => sum + value, 0) / gapSizes.length
    : 1;
  const gapVariance = gapSizes.length
    ? gapSizes.reduce((sum, value) => sum + (value - averageGapDays) ** 2, 0) / gapSizes.length
    : 0;
  const gapStdDev = Math.sqrt(gapVariance);
  const irregularGapCount = gapSizes.filter((gap) => gap > 2).length;
  const isIrregular = gapStdDev > 1.2 || irregularGapCount >= 3;

  const logsScore = clamp((loggedDays / 60) * 100);
  const consistencyBase = clamp((1 - missingRate) * 70 + Math.min((currentStreak / 14) * 30, 30));
  const consistencyPenalty = clamp(gapStdDev * 8 + irregularGapCount * 4, 0, 35);
  const consistencyScore = clamp(consistencyBase - consistencyPenalty);

  const todayUtcDay = Math.floor(Date.now() / DAY_MS);
  const daysSinceLastLog = Math.max(0, todayUtcDay - lastDay);
  const recencyScore = getRecencyScore(daysSinceLastLog);

  const score = Math.round(
    logsScore * QUALITY_CONFIG.logsWeight +
      consistencyScore * QUALITY_CONFIG.consistencyWeight +
      recencyScore * QUALITY_CONFIG.recencyWeight
  );

  const warnings = [];
  if (recentMissingRate >= 0.35) {
    warnings.push(`Recent logging gaps are high (${Math.round(recentMissingRate * 100)}% missing in the last ${recentExpectedDays} days).`);
  }
  if (missingRate >= 0.25) {
    warnings.push(`Overall data coverage is low (${Math.round(missingRate * 100)}% days missing).`);
  }
  if (isIrregular) {
    warnings.push("Logging pattern looks irregular. Insights may be less stable.");
  }
  if (daysSinceLastLog >= 5) {
    warnings.push(`Last log was ${daysSinceLastLog} days ago. Recency confidence is dropping.`);
  }
  if (loggedDays < 10) {
    warnings.push("Small sample size. Add more logs for stronger confidence.");
  }

  return {
    score,
    confidenceBand: getConfidenceBand(score),
    components: {
      logs: Math.round(logsScore),
      consistency: Math.round(consistencyScore),
      recency: Math.round(recencyScore),
    },
    missingData: {
      totalExpectedDays,
      loggedDays,
      missingDays,
      missingRate,
      recentWindowDays,
      recentExpectedDays,
      recentLoggedDays,
      recentMissingDays,
      recentMissingRate,
      sampleMissingDates: sampleMissingDates.slice(0, 5),
      warning: warnings[0] || null,
    },
    consistency: {
      currentStreak,
      longestStreak,
      irregularGapCount,
      averageGapDays: Number(averageGapDays.toFixed(2)),
      gapStdDev: Number(gapStdDev.toFixed(2)),
      isIrregular,
    },
    recency: {
      daysSinceLastLog,
      lastLogDate: new Date(lastDay * DAY_MS).toISOString().slice(0, 10),
    },
    warnings,
  };
}

function getGoalProgress(sortedLogs, rawGoals = DEFAULT_GOALS) {
  const goals = normalizeGoals(rawGoals);

  if (!sortedLogs.length) {
    return {
      goals,
      period: {
        startDate: null,
        endDate: null,
        totalDays: 0,
        totalWeeks: 0,
      },
      sleep: {
        targetPerDay: goals.sleepHoursPerDay,
        metDays: 0,
        missedDays: 0,
        completionRate: 0,
      },
      study: {
        targetPerDay: goals.studyHoursPerDay,
        metDays: 0,
        missedDays: 0,
        completionRate: 0,
      },
      workout: {
        targetPerWeek: goals.workoutTimesPerWeek,
        totalSessions: 0,
        totalTargetSessions: 0,
        metWeeks: 0,
        totalWeeks: 0,
        completionRate: 0,
        weeks: [],
      },
      overall: {
        metChecks: 0,
        totalChecks: 0,
        completionRate: 0,
      },
      feedback: [
        "No logs available yet. Add entries to evaluate goal progress.",
      ],
    };
  }

  const dailyMap = sortedLogs.reduce((acc, log) => {
    const date = toDateOnly(log);
    if (!date) {
      return acc;
    }

    if (!acc[date]) {
      acc[date] = {
        sleepValues: [],
        studyValues: [],
        workoutSessions: 0,
      };
    }

    const sleepValue = toFiniteNumber(log.sleep);
    if (sleepValue !== null) {
      acc[date].sleepValues.push(sleepValue);
    }

    const studyValue = toFiniteNumber(log.study);
    if (studyValue !== null) {
      acc[date].studyValues.push(studyValue);
    }

    const workoutValue = toFiniteNumber(log.workout);
    if (workoutValue !== null && workoutValue > 0) {
      acc[date].workoutSessions += 1;
    }

    return acc;
  }, {});

  const dayEntries = Object.entries(dailyMap)
    .map(([date, values]) => {
      const sleepAverage = values.sleepValues.length
        ? values.sleepValues.reduce((sum, value) => sum + value, 0) / values.sleepValues.length
        : null;
      const studyTotal = values.studyValues.reduce((sum, value) => sum + value, 0);

      return {
        date,
        sleepAverage,
        studyTotal,
        workoutSessions: values.workoutSessions,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  const totalDays = dayEntries.length;
  const startDate = dayEntries[0]?.date || null;
  const endDate = dayEntries[totalDays - 1]?.date || null;

  const sleepMetDays = dayEntries.filter((entry) => (entry.sleepAverage ?? 0) >= goals.sleepHoursPerDay).length;
  const studyMetDays = dayEntries.filter((entry) => (entry.studyTotal ?? 0) >= goals.studyHoursPerDay).length;

  const sleepCompletionRate = totalDays ? (sleepMetDays / totalDays) * 100 : 0;
  const studyCompletionRate = totalDays ? (studyMetDays / totalDays) * 100 : 0;

  const weekMap = dayEntries.reduce((acc, entry) => {
    const utcDay = dateToUtcDay(entry.date);
    if (utcDay === null) {
      return acc;
    }

    const weekStartUtcDay = utcDay - (utcDay % 7);
    const weekKey = new Date(weekStartUtcDay * DAY_MS).toISOString().slice(0, 10);

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart: weekKey,
        weekEnd: new Date((weekStartUtcDay + 6) * DAY_MS).toISOString().slice(0, 10),
        sessions: 0,
      };
    }

    acc[weekKey].sessions += entry.workoutSessions;
    return acc;
  }, {});

  const weeklyWorkout = Object.values(weekMap)
    .sort((left, right) => left.weekStart.localeCompare(right.weekStart))
    .map((week, index) => {
      const completionRate = Math.min(100, (week.sessions / goals.workoutTimesPerWeek) * 100);
      return {
        label: `Week ${index + 1}`,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        sessions: week.sessions,
        targetSessions: goals.workoutTimesPerWeek,
        completionRate,
        met: week.sessions >= goals.workoutTimesPerWeek,
      };
    });

  const totalWeeks = weeklyWorkout.length;
  const workoutMetWeeks = weeklyWorkout.filter((week) => week.met).length;
  const totalWorkoutSessions = weeklyWorkout.reduce((sum, week) => sum + week.sessions, 0);
  const totalTargetWorkoutSessions = totalWeeks * goals.workoutTimesPerWeek;
  const workoutCompletionRate = totalTargetWorkoutSessions
    ? Math.min(100, (totalWorkoutSessions / totalTargetWorkoutSessions) * 100)
    : 0;

  const totalChecks = totalDays * 2 + totalWeeks;
  const metChecks = sleepMetDays + studyMetDays + workoutMetWeeks;
  const overallCompletionRate = totalChecks ? (metChecks / totalChecks) * 100 : 0;

  const feedback = [
    `You met your sleep goal ${sleepMetDays} out of ${totalDays} days.`,
    `You met your study goal ${studyMetDays} out of ${totalDays} days.`,
    `You met your workout goal ${workoutMetWeeks} out of ${totalWeeks} weeks.`,
  ];

  if (weeklyWorkout.length >= 2) {
    const previousWeek = weeklyWorkout[weeklyWorkout.length - 2];
    const latestWeek = weeklyWorkout[weeklyWorkout.length - 1];
    if (latestWeek.sessions > previousWeek.sessions) {
      feedback.push("Workout consistency improved this week.");
    } else if (latestWeek.sessions < previousWeek.sessions) {
      feedback.push("Workout consistency dipped this week compared with last week.");
    } else {
      feedback.push("Workout consistency held steady this week.");
    }
  }

  return {
    goals,
    period: {
      startDate,
      endDate,
      totalDays,
      totalWeeks,
    },
    sleep: {
      targetPerDay: goals.sleepHoursPerDay,
      metDays: sleepMetDays,
      missedDays: totalDays - sleepMetDays,
      completionRate: Number(sleepCompletionRate.toFixed(1)),
    },
    study: {
      targetPerDay: goals.studyHoursPerDay,
      metDays: studyMetDays,
      missedDays: totalDays - studyMetDays,
      completionRate: Number(studyCompletionRate.toFixed(1)),
    },
    workout: {
      targetPerWeek: goals.workoutTimesPerWeek,
      totalSessions: totalWorkoutSessions,
      totalTargetSessions: totalTargetWorkoutSessions,
      metWeeks: workoutMetWeeks,
      totalWeeks,
      completionRate: Number(workoutCompletionRate.toFixed(1)),
      weeks: weeklyWorkout,
    },
    overall: {
      metChecks,
      totalChecks,
      completionRate: Number(overallCompletionRate.toFixed(1)),
    },
    feedback,
  };
}

function getPredictionConfidenceBand(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "low";
  return "very-low";
}

function getRecentLogs(sortedLogs, lookbackDays = PREDICTION_CONFIG.lookbackDays) {
  if (!sortedLogs.length) {
    return [];
  }

  const lastTimestamp = getLogTime(sortedLogs[sortedLogs.length - 1]);
  const threshold = lastTimestamp - (lookbackDays - 1) * DAY_MS;
  return sortedLogs.filter((log) => getLogTime(log) >= threshold);
}

function getMoodPrediction(sortedLogs, dataQuality) {
  if (!sortedLogs.length) {
    return {
      nextDayMood: null,
      confidence: {
        score: 0,
        band: "very-low",
      },
      inputs: {
        lookbackDays: PREDICTION_CONFIG.lookbackDays,
        sampleSize: 0,
        avgMood: null,
        avgSleep: null,
        avgStress: null,
        workoutDays: 0,
      },
      riskFlags: [],
      explanation: "Add logs to generate your first next-day mood prediction.",
    };
  }

  const recentLogs = getRecentLogs(sortedLogs);
  const sampleSize = recentLogs.length;

  const avgMood = average(recentLogs, "mood") || average(sortedLogs, "mood") || 5;
  const avgSleep = average(recentLogs, "sleep");
  const avgStress = average(recentLogs, "stress");
  const workoutDays = recentLogs.filter(
    (log) => (toFiniteNumber(log.workout) ?? 0) >= PREDICTION_CONFIG.workoutMeaningfulMinutes
  ).length;

  let adjustment = 0;

  if (avgSleep > 0) {
    if (avgSleep < PREDICTION_CONFIG.lowSleepThreshold) {
      adjustment -= 0.9;
    } else if (avgSleep < 7) {
      adjustment -= 0.4;
    } else if (avgSleep >= 8) {
      adjustment += 0.4;
    }
  }

  if (avgStress > 0) {
    if (avgStress >= PREDICTION_CONFIG.highStressThreshold) {
      adjustment -= 1.1;
    } else if (avgStress >= 5.5) {
      adjustment -= 0.5;
    } else if (avgStress <= 3.5) {
      adjustment += 0.25;
    }
  }

  if (workoutDays >= 3) {
    adjustment += 0.45;
  } else if (workoutDays === 0) {
    adjustment -= 0.3;
  }

  const predictedMood = Number(clamp(avgMood + adjustment, 1, 10).toFixed(1));
  const rangeHalfWidth = sampleSize >= 6 ? 0.7 : sampleSize >= 4 ? 1 : 1.4;
  const range = {
    min: Number(clamp(predictedMood - rangeHalfWidth, 1, 10).toFixed(1)),
    max: Number(clamp(predictedMood + rangeHalfWidth, 1, 10).toFixed(1)),
  };

  const riskFlags = [];
  if (avgSleep > 0 && avgStress > 0 && avgSleep < PREDICTION_CONFIG.lowSleepThreshold && avgStress >= PREDICTION_CONFIG.highStressThreshold) {
    riskFlags.push({
      code: "sleep-stress",
      severity: "high",
      label: "Low mood risk",
      message: "Low sleep + high stress pattern detected. Elevated next-day low mood risk.",
    });
  }

  if (predictedMood <= 4.5) {
    riskFlags.push({
      code: "low-forecast",
      severity: "high",
      label: "Low forecasted mood",
      message: "Forecast is in the lower mood range. Prioritize recovery habits today.",
    });
  }

  if (workoutDays === 0 && sampleSize >= 3) {
    riskFlags.push({
      code: "inactive-stretch",
      severity: "medium",
      label: "No recent workouts",
      message: "No meaningful workout logged in the recent window.",
    });
  }

  const sampleScore = clamp((sampleSize / PREDICTION_CONFIG.lookbackDays) * 100);
  const dataQualityScore = dataQuality?.score ?? 0;
  const stabilityPenalty = clamp(standardDeviation(recentLogs, "mood") * 12, 0, 30);
  const confidenceScore = Math.round(
    clamp(sampleScore * 0.35 + dataQualityScore * 0.5 + (100 - stabilityPenalty) * 0.15)
  );

  const explanation =
    predictedMood >= 7
      ? "Prediction suggests a relatively strong mood day if recent patterns hold."
      : predictedMood >= 5
        ? "Prediction suggests a moderate mood day based on recent balance of sleep, stress, and workout."
        : "Prediction suggests a vulnerable mood day from recent habit signals.";

  return {
    nextDayMood: predictedMood,
    range,
    confidence: {
      score: confidenceScore,
      band: getPredictionConfidenceBand(confidenceScore),
    },
    inputs: {
      lookbackDays: PREDICTION_CONFIG.lookbackDays,
      sampleSize,
      avgMood: Number(avgMood.toFixed(2)),
      avgSleep: avgSleep ? Number(avgSleep.toFixed(2)) : null,
      avgStress: avgStress ? Number(avgStress.toFixed(2)) : null,
      workoutDays,
    },
    riskFlags,
    explanation,
  };
}

function buildDecisionLayer(sortedLogs, prediction, goalProgress) {
  const recentLogs = getRecentLogs(sortedLogs);
  const recommendations = [];

  const avgSleep = prediction?.inputs?.avgSleep ?? average(recentLogs, "sleep");
  const avgStress = prediction?.inputs?.avgStress ?? average(recentLogs, "stress");
  const avgScreenTime = average(recentLogs, "screenTime");
  const workoutDays = prediction?.inputs?.workoutDays ?? 0;

  if ((avgSleep ?? 0) < 7) {
    recommendations.push({
      key: "sleep-window",
      priority: "high",
      title: "Aim for 7-8h sleep",
      reason: `Recent average is ${Number(avgSleep || 0).toFixed(1)}h, which is below your target zone.`,
      expectedImpact: "Lower low-mood risk and improve next-day stability.",
    });
  }

  if ((avgScreenTime ?? 0) > RULE_CONFIG.screenTimeHighThreshold) {
    recommendations.push({
      key: "screen-cutoff",
      priority: "medium",
      title: "Reduce screen time after 10pm",
      reason: `Recent screen time is ${Number(avgScreenTime || 0).toFixed(1)}h/day, linked with lower focus and mood volatility.`,
      expectedImpact: "Support better sleep quality and morning mood.",
    });
  }

  if ((avgStress ?? 0) >= 6.5) {
    recommendations.push({
      key: "stress-buffer",
      priority: "high",
      title: "Add a 15-minute evening stress buffer",
      reason: `Stress is averaging ${Number(avgStress || 0).toFixed(1)}, which is in the higher-risk zone.`,
      expectedImpact: "Reduce probability of a low next-day mood forecast.",
    });
  }

  if (workoutDays < 3) {
    recommendations.push({
      key: "workout-consistency",
      priority: "medium",
      title: "Schedule 3 workout sessions this week",
      reason: `Only ${workoutDays} recent workout days detected in the forecast window.`,
      expectedImpact: "Increase mood lift probability and improve goal completion.",
    });
  }

  const goalActions = [];
  const totalDays = goalProgress?.period?.totalDays || 0;
  if (totalDays > 0 && (goalProgress?.sleep?.completionRate ?? 0) < 70) {
    goalActions.push(
      `Sleep goal is at ${goalProgress.sleep.completionRate}%. Add a fixed bedtime for the next 3 nights.`
    );
  }

  if (totalDays > 0 && (goalProgress?.study?.completionRate ?? 0) < 70) {
    goalActions.push(
      `Study goal is at ${goalProgress.study.completionRate}%. Block one 45-minute focus session tomorrow.`
    );
  }

  if ((goalProgress?.workout?.completionRate ?? 0) < 70) {
    goalActions.push(
      `Workout goal is at ${goalProgress?.workout?.completionRate ?? 0}%. Plan your next session in calendar now.`
    );
  }

  if (!recommendations.length) {
    recommendations.push({
      key: "maintain",
      priority: "low",
      title: "Maintain current routine",
      reason: "Recent behavior is balanced with no major risk signals.",
      expectedImpact: "Keep consistency to preserve prediction confidence.",
    });
  }

  const headline = recommendations[0]
    ? `Top action: ${recommendations[0].title}`
    : "Top action: Keep logging consistently.";

  return {
    headline,
    recommendations,
    goalActions,
  };
}

function getOutlierSummary(sortedLogs) {
  if (sortedLogs.length < 4) {
    return {
      count: 0,
      metrics: {},
      rows: [],
    };
  }

  const metrics = ["sleep", "mood", "stress", "study", "workout", "water", "focus", "screenTime"];
  const meanByMetric = Object.fromEntries(metrics.map((metric) => [metric, average(sortedLogs, metric)]));
  const stdByMetric = Object.fromEntries(metrics.map((metric) => [metric, standardDeviation(sortedLogs, metric) || 1]));

  const rows = [];
  const metricCounts = {};

  sortedLogs.forEach((log) => {
    metrics.forEach((metric) => {
      const value = toFiniteNumber(log[metric]);
      if (value === null) {
        return;
      }

      const zScore = (value - meanByMetric[metric]) / stdByMetric[metric];
      if (Math.abs(zScore) >= 2) {
        rows.push({
          date: log.date || "Unknown",
          metric,
          value,
          zScore: Number(zScore.toFixed(2)),
        });
        metricCounts[metric] = (metricCounts[metric] || 0) + 1;
      }
    });
  });

  return {
    count: rows.length,
    metrics: metricCounts,
    rows: rows.slice(-6),
  };
}

function getConsistencyIndicators(sortedLogs) {
  const sleepStd = standardDeviation(sortedLogs, "sleep");
  const moodStd = standardDeviation(sortedLogs, "mood");
  const stressStd = standardDeviation(sortedLogs, "stress");

  const sleepScore = Math.max(0, 100 - sleepStd * 25);
  const moodStabilityScore = Math.max(0, 100 - moodStd * 20);
  const stressScore = Math.max(0, 100 - stressStd * 20);

  return {
    sleep: {
      stdDev: Number(sleepStd.toFixed(2)),
      score: Math.round(sleepScore),
    },
    mood: {
      stdDev: Number(moodStd.toFixed(2)),
      score: Math.round(moodStabilityScore),
    },
    stress: {
      stdDev: Number(stressStd.toFixed(2)),
      score: Math.round(stressScore),
    },
  };
}

export function analyzeHabitData(logs, goals) {
  const sortedLogs = sortLogs(logs);
  const weeklyAverages = getWeeklyAverages(sortedLogs);
  const rollingAverages = getRollingAverages(sortedLogs);
  const anomalies = getAnomalies(sortedLogs);
  const { correlations, driverRanking } = buildCorrelationInsights(sortedLogs);
  const insightEngine = buildRuleBasedInsights(sortedLogs);
  const strongestDriver = driverRanking[0] || null;
  const kpis = buildKpis(sortedLogs);
  const dataQuality = getDataQualityMetrics(sortedLogs);
  const goalProgress = getGoalProgress(sortedLogs, goals);
  const prediction = getMoodPrediction(sortedLogs, dataQuality);
  const decisionLayer = buildDecisionLayer(sortedLogs, prediction, goalProgress);
  const outliers = getOutlierSummary(sortedLogs);
  const consistencyIndicators = getConsistencyIndicators(sortedLogs);

  const rollingTrend = rollingAverages.length >= 2 ? rollingAverages : [];
  const firstRolling = rollingTrend[0] || null;
  const lastRolling = rollingTrend[rollingTrend.length - 1] || null;

  const trendInsights = rollingTrend.length
    ? [
        getTrendText("sleep", firstRolling.sleep, lastRolling.sleep),
        getTrendText("stress", firstRolling.stress, lastRolling.stress),
        getTrendText("mood", firstRolling.mood, lastRolling.mood),
        getTrendText("workout", firstRolling.workout, lastRolling.workout),
      ]
    : ["Add a few more logs and the rolling trend lines will become clearer."];

  const summaryInsights = [];

  summaryInsights.push(...insightEngine.computedInsights.slice(0, 3));

  if (strongestDriver) {
    summaryInsights.push(`Strongest habit driver: ${strongestDriver.label}. ${strongestDriver.explanation}`);
  }

  if (anomalies.length) {
    summaryInsights.push(`Unusual days: ${anomalies[anomalies.length - 1].message}`);
  }

  if (!summaryInsights.length) {
    summaryInsights.push("Your data is still small, but the dashboard is ready to learn from more logs.");
  }

  if (dataQuality.warnings.length) {
    summaryInsights.push(`Data quality check: ${dataQuality.warnings[0]}`);
  }

  if (goalProgress.feedback.length) {
    summaryInsights.push(`Goal tracking: ${goalProgress.feedback[0]}`);
  }

  if (prediction.nextDayMood !== null) {
    summaryInsights.push(
      `Prediction: next-day mood ${prediction.nextDayMood}/10 (confidence ${prediction.confidence.score}%).`
    );
  }

  if (decisionLayer.headline) {
    summaryInsights.push(`Decision layer: ${decisionLayer.headline}`);
  }

  if (outliers.count) {
    summaryInsights.push(`Outlier watch: ${outliers.count} unusual metric events detected recently.`);
  }

  return {
    kpis,
    weeklyAverages,
    rollingAverages,
    correlations,
    driverRanking,
    strongestDriver,
    insightEngine,
    anomalies,
    trendInsights,
    summaryInsights,
    dataQuality,
    goalProgress,
    prediction,
    decisionLayer,
    outliers,
    consistencyIndicators,
    chartSeries: rollingAverages,
    emptyMessage: sortedLogs.length ? null : "No data yet. Add your first entry to start the dashboard.",
  };
}
