import { useState } from "react";
import { AppProvider, useApp, getElderId } from "@/context";
import AuthScreen from "@/screens/AuthScreen";
import PairingScreen from "@/screens/PairingScreen";
import BottomNav, { type Tab } from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import MissedDoseAlarm from "@/components/MissedDoseAlarm";
import ElderHome from "@/screens/ElderHome";
import ElderHistory from "@/screens/ElderHistory";
import ElderWellness from "@/screens/ElderWellness";
import ElderFamily from "@/screens/ElderFamily";
import CaregiverHome from "@/screens/CaregiverHome";
import CaregiverHistory from "@/screens/CaregiverHistory";
import CaregiverWellness from "@/screens/CaregiverWellness";
import CaregiverFamily from "@/screens/CaregiverFamily";

function AppInner() {
  const { currentUser, state } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [showPairing, setShowPairing] = useState(false);
  const elderId = currentUser
    ? getElderId(state, currentUser.id, currentUser.role)
    : null;
  const caregiverAlert =
    currentUser?.role === "caregiver" && elderId
      ? (state.alerts.find(
          (alert) =>
            alert.elderId === elderId &&
            alert.caregiverNotifiedAt &&
            !alert.acknowledged,
        ) ?? null)
      : null;

  if (!currentUser) {
    return <AuthScreen />;
  }

  if (showPairing) {
    return <PairingScreen onDone={() => setShowPairing(false)} />;
  }

  const isElder = currentUser.role === "elder";

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader onOpenPairing={() => setShowPairing(true)} />
      <main className="max-w-2xl mx-auto pb-20 min-h-screen">
        {isElder ? (
          <>
            {tab === "home" && <ElderHome />}
            {tab === "history" && <ElderHistory />}
            {tab === "wellness" && <ElderWellness />}
            {tab === "family" && <ElderFamily />}
          </>
        ) : (
          <>
            {tab === "home" && <CaregiverHome onNavigate={setTab} />}
            {tab === "history" && <CaregiverHistory />}
            {tab === "wellness" && <CaregiverWellness />}
            {tab === "family" && <CaregiverFamily />}
          </>
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} role={currentUser.role} />
      {isElder && <MissedDoseAlarm />}
      {!isElder && caregiverAlert && (
        <CaregiverReminderPopup alert={caregiverAlert} />
      )}
    </div>
  );
}

function CaregiverReminderPopup({
  alert,
}: {
  alert: {
    medicineName: string;
    time: string;
    date: string;
    caregiverNotifiedAt?: number;
  };
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/85 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <MissedDoseAlarmIcon />
        </div>
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">
          Caregiver Notification
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Medicine overdue
        </h2>
        <p className="text-gray-600 mb-1">{alert.medicineName}</p>
        <p className="text-gray-500 text-sm mb-6">
          Scheduled at {formatTime(alert.time)} on {formatDate(alert.date)}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 py-3 rounded-2xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all"
          >
            View Later
          </button>
        </div>
      </div>
    </div>
  );
}

function MissedDoseAlarmIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 8v5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 16h.01"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(d: string): string {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
