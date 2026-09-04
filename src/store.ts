import type {
  User,
  Pairing,
  Prescription,
  MedicineLog,
  CheckIn,
  Sticker,
  VoiceNote,
  MissedAlert,
} from "./types";

const KEY = "medpal_state_v1";

export interface AppState {
  users: User[];
  pairings: Pairing[];
  prescriptions: Prescription[];
  logs: MedicineLog[];
  checkIns: CheckIn[];
  stickers: Sticker[];
  voiceNotes: VoiceNote[];
  alerts: MissedAlert[];
  currentUserId: string | null;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore
  }
  return {
    users: [],
    pairings: [],
    prescriptions: [],
    logs: [],
    checkIns: [],
    stickers: [],
    voiceNotes: [],
    alerts: [],
    currentUserId: null,
  };
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

// ---- Date helpers ----

export function todayStr(): string {
  return dateStr(new Date());
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

export function parseDate(date: string): Date {
  return new Date(date + "T00:00:00");
}

// ---- Schedule generation ----

export function generateLogsForPrescription(
  p: Prescription,
  existingLogs: MedicineLog[],
): MedicineLog[] {
  const logs: MedicineLog[] = [];
  const endDate = p.isLongTerm ? todayStr() : addDays(p.startDate, p.days - 1);
  let d = p.startDate;
  while (d <= endDate) {
    for (const time of p.times) {
      // skip if log already exists
      if (
        existingLogs.some(
          (l) => l.prescriptionId === p.id && l.date === d && l.time === time,
        )
      ) {
        continue;
      }
      const status = computeLogStatus(d, time);
      logs.push({
        id: uid(),
        prescriptionId: p.id,
        elderId: p.elderId,
        date: d,
        time,
        status,
      });
    }
    d = addDays(d, 1);
  }
  return logs;
}

export function computeLogStatus(
  date: string,
  time: string,
): "upcoming" | "due" | "missed" {
  const now = new Date();
  const logDateTime = new Date(date + "T" + time + ":00");
  if (now < logDateTime) return "upcoming";
  if (now.getTime() - logDateTime.getTime() >= 4 * 60 * 60 * 1000)
    return "missed";
  return "due";
}

export function getTodaySchedule(
  prescriptions: Prescription[],
  logs: MedicineLog[],
): MedicineLog[] {
  const t = todayStr();
  return logs
    .filter(
      (l) =>
        l.date === t &&
        prescriptions.some((p) => p.id === l.prescriptionId && p.active),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function dosesRemaining(p: Prescription, logs: MedicineLog[]): number {
  const taken = logs.filter(
    (l) =>
      l.prescriptionId === p.id &&
      (l.status === "taken" || l.status === "taken-late"),
  ).length;
  return Math.max(0, p.totalDoses - taken);
}

export function daysOfSupplyRemaining(
  p: Prescription,
  logs: MedicineLog[],
): number {
  const remaining = dosesRemaining(p, logs);
  const perDay = p.timesPerDay || 1;
  return Math.floor(remaining / perDay);
}

export function computeStreak(
  prescriptions: Prescription[],
  logs: MedicineLog[],
): number {
  // streak = consecutive days (ending today or yesterday) where every scheduled dose was taken on time
  const activeIds = new Set(
    prescriptions.filter((p) => p.active).map((p) => p.id),
  );
  const allLogs = logs.filter((l) => activeIds.has(l.prescriptionId));

  let streak = 0;
  let d = todayStr();
  // allow today to not break streak if doses still pending
  const todayLogs = allLogs.filter((l) => l.date === d);
  const todayMissed = todayLogs.some((l) => l.status === "missed");
  if (todayMissed) {
    d = addDays(d, -1);
  } else if (
    todayLogs.length > 0 &&
    todayLogs.every((l) => l.status === "taken")
  ) {
    // today complete, count it
  } else if (todayLogs.length > 0) {
    // today pending, streak counts up to yesterday
    d = addDays(d, -1);
  } else {
    // no doses today yet, count up to yesterday
    d = addDays(d, -1);
  }

  while (true) {
    const dayLogs = allLogs.filter((l) => l.date === d);
    if (dayLogs.length === 0) {
      // no scheduled doses that day - check if there were any prescriptions active that day
      // For simplicity, if no logs, streak breaks
      break;
    }
    const allTaken = dayLogs.every((l) => l.status === "taken");
    if (!allTaken) break;
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}
