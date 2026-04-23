const SCHEMA_VERSION = 2;

function getDefaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimestamp(date, timestamp) {
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    return timestamp;
  }

  const parsed = Date.parse(`${date}T12:00:00`);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeDate(raw) {
  if (typeof raw.date === "string" && raw.date) {
    return raw.date;
  }

  const time = typeof raw.timestamp === "number" ? raw.timestamp : Date.now();
  return new Date(time).toISOString().slice(0, 10);
}

function normalizeEntry(raw, index = 0) {
  const date = normalizeDate(raw);
  const timestamp = parseTimestamp(date, raw.timestamp);

  const metrics = {
    sleepHours: toNumberOrNull(raw.metrics?.sleepHours ?? raw.sleep),
    mood: toNumberOrNull(raw.metrics?.mood ?? raw.mood),
    stress: toNumberOrNull(raw.metrics?.stress ?? raw.stress),
    studyHours: toNumberOrNull(raw.metrics?.studyHours ?? raw.study),
    workoutMinutes: toNumberOrNull(raw.metrics?.workoutMinutes ?? raw.workout),
    waterLiters: toNumberOrNull(raw.metrics?.waterLiters ?? raw.water),
    focusQuality: toNumberOrNull(raw.metrics?.focusQuality ?? raw.focus),
    screenTimeHours: toNumberOrNull(raw.metrics?.screenTimeHours ?? raw.screenTime),
  };

  return {
    id: raw.id || `legacy-log-${index}-${timestamp}`,
    date,
    timestamp,
    metrics,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt || new Date(timestamp).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyLogStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    timezone: getDefaultTimezone(),
    logsByDate: {},
  };
}

export function migrateToLogStore(savedData, legacyLogs = []) {
  const baseStore = createEmptyLogStore();

  if (savedData && typeof savedData === "object" && savedData.schemaVersion === SCHEMA_VERSION) {
    const logsByDateObj = savedData.logsByDate || {};
    
    // Convert to new composite key format if needed (handle both old and new formats)
    const normalizedLogs = Object.entries(logsByDateObj).reduce((acc, [key, entry]) => {
      const normalized = normalizeEntry(entry, Object.keys(acc).length);
      const storageKey = `${normalized.date}|${normalized.id}`;
      acc[storageKey] = normalized;
      return acc;
    }, {});
    
    return {
      schemaVersion: SCHEMA_VERSION,
      timezone: savedData.timezone || baseStore.timezone,
      logsByDate: normalizedLogs,
    };
  }

  const sourceLogs = Array.isArray(savedData)
    ? savedData
    : Array.isArray(legacyLogs)
      ? legacyLogs
      : [];

  if (!sourceLogs.length) {
    return baseStore;
  }

  const entries = sourceLogs.map((entry, index) => normalizeEntry(entry, index));
  return {
    ...baseStore,
    logsByDate: Object.fromEntries(
      entries.map((entry) => [`${entry.date}|${entry.id}`, entry])
    ),
  };
}

function toFlatLog(entry) {
  return {
    id: entry.id,
    date: entry.date,
    timestamp: entry.timestamp,
    sleep: entry.metrics.sleepHours,
    mood: entry.metrics.mood,
    stress: entry.metrics.stress,
    study: entry.metrics.studyHours,
    workout: entry.metrics.workoutMinutes,
    water: entry.metrics.waterLiters,
    focus: entry.metrics.focusQuality,
    screenTime: entry.metrics.screenTimeHours,
    notes: entry.notes,
    tags: entry.tags,
  };
}

export function getLogsArrayFromStore(store) {
  return Object.values(store?.logsByDate || {})
    .map((entry) => toFlatLog(entry))
    .sort((left, right) => Number(left.timestamp || 0) - Number(right.timestamp || 0));
}

export function upsertLogInStore(store, flatLog) {
  const normalized = normalizeEntry(flatLog);
  const nextLogsByDate = { ...(store?.logsByDate || {}) };
  
  // Use a composite key: date + id to allow multiple logs per day
  const storageKey = `${normalized.date}|${normalized.id}`;
  
  nextLogsByDate[storageKey] = normalized;

  return {
    ...(store || createEmptyLogStore()),
    schemaVersion: SCHEMA_VERSION,
    timezone: store?.timezone || getDefaultTimezone(),
    logsByDate: nextLogsByDate,
  };
}

export function removeLogFromStore(store, id) {
  if (!store?.logsByDate || !id) {
    return store;
  }

  const nextLogsByDate = { ...store.logsByDate };
  
  // Find and remove the entry by id (which may be in a composite key)
  const match = Object.entries(nextLogsByDate).find(([, entry]) => entry.id === id);

  if (match) {
    delete nextLogsByDate[match[0]];
  }

  return {
    ...store,
    logsByDate: nextLogsByDate,
  };
}
