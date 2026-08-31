import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  User,
  Pairing,
  Prescription,
  MedicineLog,
  CheckIn,
  Sticker,
  VoiceNote,
  MissedAlert,
  Role,
} from "./types";
import {
  loadState,
  saveState,
  uid,
  generateLogsForPrescription,
  computeLogStatus,
  todayStr,
  addDays,
  type AppState,
} from "./store";

interface AppContextValue {
  state: AppState;
  currentUser: User | null;
  // auth
  signUp: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => string | null;
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  // pairing
  pairByCode: (code: string) => string | null;
  getPairingCode: () => string | null;
  // prescriptions
  addPrescription: (
    p: Omit<Prescription, "id" | "createdAt" | "active">,
  ) => void;
  updatePrescription: (id: string, patch: Partial<Prescription>) => void;
  stopPrescription: (id: string) => void;
  // logs
  confirmDose: (logId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  // check-ins
  addCheckIn: (c: Omit<CheckIn, "id" | "createdAt">) => void;
  // stickers
  sendSticker: (type: string, milestone: number, message: string) => void;
  // voice notes
  addVoiceNote: (
    dataUrl: string,
    label: string,
    prescriptionId?: string,
  ) => void;
  // restock
  restock: (prescriptionId: string, extraDoses: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveState(state);
  }, [state]);

  // tick frequently so due-dose reminders can ring on time and repeat every 5 minutes
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const notificationsToSend: Array<{
        title: string;
        body: string;
        tag: string;
      }> = [];

      setState((prev) => {
        const now = Date.now();
        const activeAlertKeys = new Set(
          prev.alerts.map(
            (a) => `${a.prescriptionId}-${a.date}-${a.time}-${a.createdAt}`,
          ),
        );
        let changed = false;
        const newLogs = prev.logs.map((l) => {
          if (l.status !== "pending") return l;

          const logDateTime = new Date(`${l.date}T${l.time}:00`).getTime();
          if (now < logDateTime) return l;

          const s = computeLogStatus(l.date, l.time);
          if (s === "missed") {
            changed = true;
            return { ...l, status: "missed" as const };
          }
          return l;
        });

        const newAlerts: MissedAlert[] = [];
        for (const l of newLogs) {
          if (l.status === "taken") continue;

          const logDateTime = new Date(`${l.date}T${l.time}:00`).getTime();
          if (now < logDateTime) continue;

          const reminderIndex = Math.floor(
            (now - logDateTime) / (5 * 60 * 1000),
          );
          const reminderCreatedAt = logDateTime + reminderIndex * 5 * 60 * 1000;
          const key = `${l.prescriptionId}-${l.date}-${l.time}-${reminderCreatedAt}`;
          if (activeAlertKeys.has(key)) continue;

          const rx = prev.prescriptions.find((p) => p.id === l.prescriptionId);
          newAlerts.push({
            id: uid(),
            elderId: l.elderId,
            prescriptionId: l.prescriptionId,
            date: l.date,
            time: l.time,
            medicineName: rx?.medicineName ?? "Medicine",
            acknowledged: false,
            createdAt: reminderCreatedAt,
          });
          activeAlertKeys.add(key);
          changed = true;
        }

        const currentUser = prev.currentUserId
          ? (prev.users.find((u) => u.id === prev.currentUserId) ?? null)
          : null;
        const currentUserIsCaregiver = currentUser?.role === "caregiver";
        const notificationLeadTime = 2 * 60 * 60 * 1000;
        const nextAlerts = [...prev.alerts, ...newAlerts];
        const notifiedDoseKeys = new Set<string>();

        const alertsWithCaregiverNotice = nextAlerts.map((alert) => {
          if (alert.caregiverNotifiedAt) return alert;
          if (alert.acknowledged) return alert;

          const logDateTime = new Date(
            `${alert.date}T${alert.time}:00`,
          ).getTime();
          if (now - logDateTime < notificationLeadTime) return alert;

          const pairing = currentUserIsCaregiver
            ? prev.pairings.find(
                (p) =>
                  p.elderId === alert.elderId &&
                  p.caregiverId === currentUser.id,
              )
            : null;
          if (!pairing) return alert;

          const doseKey = `${alert.prescriptionId}-${alert.date}-${alert.time}`;
          if (notifiedDoseKeys.has(doseKey)) return alert;

          const shouldNotify =
            typeof Notification !== "undefined" &&
            Notification.permission === "granted";

          if (shouldNotify) {
            const elder = prev.users.find((u) => u.id === alert.elderId);
            notificationsToSend.push({
              title: "Medicine overdue",
              body: `${alert.medicineName} for ${elder?.name ?? "your Elder"} is overdue by 2 hours.`,
              tag: doseKey,
            });
          }

          notifiedDoseKeys.add(doseKey);
          changed = true;
          return { ...alert, caregiverNotifiedAt: now };
        });

        if (!changed && newAlerts.length === 0) return prev;
        return {
          ...prev,
          logs: newLogs,
          alerts: alertsWithCaregiverNotice,
        };
      });

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        for (const notification of notificationsToSend) {
          new Notification(notification.title, {
            body: notification.body,
            tag: notification.tag,
          });
        }
      }

      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const value: AppContextValue = {
    state,
    currentUser,
    signUp: (name, email, password, role) => {
      const existing = stateRef.current.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (existing) return "An account with that email already exists.";
      const user: User = {
        id: uid(),
        name,
        email,
        password,
        role,
        createdAt: Date.now(),
      };
      setState((p) => ({
        ...p,
        users: [...p.users, user],
        currentUserId: user.id,
      }));
      return null;
    },
    signIn: (email, password) => {
      const user = stateRef.current.users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password,
      );
      if (!user) return "Invalid email or password.";
      setState((p) => ({ ...p, currentUserId: user.id }));
      return null;
    },
    signOut: () => setState((p) => ({ ...p, currentUserId: null })),
    pairByCode: (code) => {
      if (!currentUser) return "Not signed in.";
      // code = elder's userId (prototype)
      const elder = stateRef.current.users.find(
        (u) => u.id === code && u.role === "elder",
      );
      if (!elder) return "Invalid pairing code.";
      if (elder.id === currentUser.id) return "You cannot pair with yourself.";
      const exists = stateRef.current.pairings.some(
        (pr) => pr.elderId === elder.id && pr.caregiverId === currentUser.id,
      );
      if (exists) return "Already paired.";
      const pairing: Pairing = {
        id: uid(),
        elderId: elder.id,
        caregiverId: currentUser.id,
        createdAt: Date.now(),
      };
      setState((p) => ({ ...p, pairings: [...p.pairings, pairing] }));
      return null;
    },
    getPairingCode: () => {
      if (!currentUser || currentUser.role !== "elder") return null;
      return currentUser.id;
    },
    addPrescription: (p) => {
      const full: Prescription = {
        ...p,
        id: uid(),
        active: true,
        createdAt: Date.now(),
      };
      setState((prev) => {
        const newLogs = generateLogsForPrescription(full, prev.logs);
        return {
          ...prev,
          prescriptions: [...prev.prescriptions, full],
          logs: [...prev.logs, ...newLogs],
        };
      });
    },
    updatePrescription: (id, patch) => {
      setState((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      }));
    },
    stopPrescription: (id) => {
      setState((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((p) =>
          p.id === id ? { ...p, active: false } : p,
        ),
        // remove future pending logs
        logs: prev.logs.filter(
          (l) => !(l.prescriptionId === id && l.status === "pending"),
        ),
      }));
    },
    confirmDose: (logId) => {
      setState((prev) => ({
        ...prev,
        logs: prev.logs.map((l) =>
          l.id === logId
            ? { ...l, status: "taken" as const, confirmedAt: Date.now() }
            : l,
        ),
        // dismiss related alert
        alerts: prev.alerts.map((a) => {
          const log = prev.logs.find((l) => l.id === logId);
          if (
            log &&
            a.prescriptionId === log.prescriptionId &&
            a.date === log.date &&
            a.time === log.time
          ) {
            return { ...a, acknowledged: true };
          }
          return a;
        }),
      }));
    },
    acknowledgeAlert: (alertId) => {
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a,
        ),
      }));
    },
    addCheckIn: (c) => {
      // replace existing for same elder+date
      setState((prev) => {
        const filtered = prev.checkIns.filter(
          (x) => !(x.elderId === c.elderId && x.date === c.date),
        );
        const full: CheckIn = { ...c, id: uid(), createdAt: Date.now() };
        return { ...prev, checkIns: [...filtered, full] };
      });
    },
    sendSticker: (type, milestone, message) => {
      if (!currentUser) return;
      const elderId = getElderIdForCaregiver(stateRef.current, currentUser.id);
      if (!elderId) return;
      const sticker: Sticker = {
        id: uid(),
        elderId,
        caregiverId: currentUser.id,
        type,
        milestone,
        message,
        createdAt: Date.now(),
      };
      setState((p) => ({ ...p, stickers: [...p.stickers, sticker] }));
    },
    addVoiceNote: (dataUrl, label, prescriptionId) => {
      if (!currentUser) return;
      const elderId = getElderIdForCaregiver(stateRef.current, currentUser.id);
      if (!elderId) return;
      const note: VoiceNote = {
        id: uid(),
        elderId,
        caregiverId: currentUser.id,
        dataUrl,
        label,
        prescriptionId,
        createdAt: Date.now(),
      };
      setState((p) => ({ ...p, voiceNotes: [...p.voiceNotes, note] }));
    },
    restock: (prescriptionId, extraDoses) => {
      setState((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((p) =>
          p.id === prescriptionId
            ? { ...p, totalDoses: p.totalDoses + extraDoses }
            : p,
        ),
      }));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function getElderIdForCaregiver(
  state: AppState,
  caregiverId: string,
): string | null {
  const pairing = state.pairings.find((p) => p.caregiverId === caregiverId);
  return pairing?.elderId ?? null;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// helper exported for components
export function getElderId(
  state: AppState,
  userId: string,
  role: Role,
): string | null {
  if (role === "elder") return userId;
  const pairing = state.pairings.find((p) => p.caregiverId === userId);
  return pairing?.elderId ?? null;
}

// re-export helpers used by components
export { todayStr, addDays };
