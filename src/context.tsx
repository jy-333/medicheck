import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
} from './types';
import {
  loadState,
  saveState,
  uid,
  generateLogsForPrescription,
  computeLogStatus,
  todayStr,
  addDays,
  type AppState,
} from './store';

interface AppContextValue {
  state: AppState;
  currentUser: User | null;
  // auth
  signUp: (name: string, email: string, password: string, role: Role) => string | null;
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  // pairing
  pairByCode: (code: string) => string | null;
  getPairingCode: () => string | null;
  // prescriptions
  addPrescription: (p: Omit<Prescription, 'id' | 'createdAt' | 'active'>) => void;
  updatePrescription: (id: string, patch: Partial<Prescription>) => void;
  stopPrescription: (id: string) => void;
  // logs
  confirmDose: (logId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  // check-ins
  addCheckIn: (c: Omit<CheckIn, 'id' | 'createdAt'>) => void;
  // stickers
  sendSticker: (type: string, milestone: number, message: string) => void;
  // voice notes
  addVoiceNote: (dataUrl: string, label: string, prescriptionId?: string) => void;
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

  // tick every 30s to recompute missed doses
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        let changed = false;
        const newLogs = prev.logs.map((l) => {
          if (l.status === 'pending') {
            const s = computeLogStatus(l.date, l.time);
            if (s === 'missed') {
              changed = true;
              return { ...l, status: 'missed' as const };
            }
          }
          return l;
        });
        if (!changed) return prev;

        // create alerts for newly missed
        const existingAlertKeys = new Set(prev.alerts.map((a) => `${a.prescriptionId}-${a.date}-${a.time}`));
        const newAlerts: MissedAlert[] = [];
        for (const l of newLogs) {
          if (l.status === 'missed') {
            const key = `${l.prescriptionId}-${l.date}-${l.time}`;
            if (!existingAlertKeys.has(key)) {
              const rx = prev.prescriptions.find((p) => p.id === l.prescriptionId);
              newAlerts.push({
                id: uid(),
                elderId: l.elderId,
                prescriptionId: l.prescriptionId,
                date: l.date,
                time: l.time,
                medicineName: rx?.medicineName ?? 'Medicine',
                acknowledged: false,
                createdAt: Date.now(),
              });
              existingAlertKeys.add(key);
            }
          }
        }
        return { ...prev, logs: newLogs, alerts: [...prev.alerts, ...newAlerts] };
      });
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const value: AppContextValue = {
    state,
    currentUser,
    signUp: (name, email, password, role) => {
      const existing = stateRef.current.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) return 'An account with that email already exists.';
      const user: User = {
        id: uid(),
        name,
        email,
        password,
        role,
        createdAt: Date.now(),
      };
      setState((p) => ({ ...p, users: [...p.users, user], currentUserId: user.id }));
      return null;
    },
    signIn: (email, password) => {
      const user = stateRef.current.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!user) return 'Invalid email or password.';
      setState((p) => ({ ...p, currentUserId: user.id }));
      return null;
    },
    signOut: () => setState((p) => ({ ...p, currentUserId: null })),
    pairByCode: (code) => {
      if (!currentUser) return 'Not signed in.';
      // code = elder's userId (prototype)
      const elder = stateRef.current.users.find((u) => u.id === code && u.role === 'elder');
      if (!elder) return 'Invalid pairing code.';
      if (elder.id === currentUser.id) return 'You cannot pair with yourself.';
      const exists = stateRef.current.pairings.some(
        (pr) => pr.elderId === elder.id && pr.caregiverId === currentUser.id
      );
      if (exists) return 'Already paired.';
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
      if (!currentUser || currentUser.role !== 'elder') return null;
      return currentUser.id;
    },
    addPrescription: (p) => {
      const full: Prescription = { ...p, id: uid(), active: true, createdAt: Date.now() };
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
        prescriptions: prev.prescriptions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    stopPrescription: (id) => {
      setState((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((p) => (p.id === id ? { ...p, active: false } : p)),
        // remove future pending logs
        logs: prev.logs.filter((l) => !(l.prescriptionId === id && l.status === 'pending')),
      }));
    },
    confirmDose: (logId) => {
      setState((prev) => ({
        ...prev,
        logs: prev.logs.map((l) =>
          l.id === logId ? { ...l, status: 'taken' as const, confirmedAt: Date.now() } : l
        ),
        // dismiss related alert
        alerts: prev.alerts.map((a) => {
          const log = prev.logs.find((l) => l.id === logId);
          if (log && a.prescriptionId === log.prescriptionId && a.date === log.date && a.time === log.time) {
            return { ...a, acknowledged: true };
          }
          return a;
        }),
      }));
    },
    acknowledgeAlert: (alertId) => {
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
      }));
    },
    addCheckIn: (c) => {
      // replace existing for same elder+date
      setState((prev) => {
        const filtered = prev.checkIns.filter((x) => !(x.elderId === c.elderId && x.date === c.date));
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
          p.id === prescriptionId ? { ...p, totalDoses: p.totalDoses + extraDoses } : p
        ),
      }));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function getElderIdForCaregiver(state: AppState, caregiverId: string): string | null {
  const pairing = state.pairings.find((p) => p.caregiverId === caregiverId);
  return pairing?.elderId ?? null;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// helper exported for components
export function getElderId(state: AppState, userId: string, role: Role): string | null {
  if (role === 'elder') return userId;
  const pairing = state.pairings.find((p) => p.caregiverId === userId);
  return pairing?.elderId ?? null;
}

// re-export helpers used by components
export { todayStr, addDays };
