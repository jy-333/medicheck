import { useApp, getElderId } from "@/context";
import {
  getTodaySchedule,
  computeStreak,
  dosesRemaining,
  daysOfSupplyRemaining,
} from "@/store";
import type { MedicineLog } from "@/types";
import {
  Check,
  Flame,
  Clock,
  Pill,
  AlertTriangle,
  Volume2,
  Play,
} from "lucide-react";

export default function ElderHome() {
  const { state, currentUser, confirmDose } = useApp();
  if (!currentUser) return null;

  const elderId = currentUser.id;
  const elderRx = state.prescriptions.filter(
    (p) => p.elderId === elderId && p.active,
  );
  const schedule = getTodaySchedule(state.prescriptions, state.logs);
  const streak = computeStreak(
    state.prescriptions.filter((p) => p.elderId === elderId),
    state.logs.filter((l) => l.elderId === elderId),
  );
  const myStickers = state.stickers.filter((s) => s.elderId === elderId);
  const recentStickers = [...myStickers]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const takenCount = schedule.filter((l) => l.status === "taken").length;
  const totalCount = schedule.length;

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-gray-400 text-sm font-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Hello, {currentUser.name.split(" ")[0]}
        </h1>
      </div>

      {/* Streak + progress card */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-6 h-6" />
            <span className="font-semibold text-sm opacity-90">Streak</span>
          </div>
          <p className="text-4xl font-bold">{streak}</p>
          <p className="text-sm opacity-80 mt-0.5">days in a row</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-6 h-6" />
            <span className="font-semibold text-sm opacity-90">Today</span>
          </div>
          <p className="text-4xl font-bold">
            {takenCount}/{totalCount}
          </p>
          <p className="text-sm opacity-80 mt-0.5">doses taken</p>
        </div>
      </div>

      {/* Recent stickers */}
      {recentStickers.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Encouragement
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentStickers.map((s) => (
              <div
                key={s.id}
                className="shrink-0 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl px-4 py-3 text-center"
              >
                <p className="text-3xl">{STICKER_EMOJI[s.type] ?? "🎉"}</p>
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {s.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's medicines */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">
        Today's Medicines
      </h2>
      {schedule.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">
            No medicines scheduled for today.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((log) => (
            <DoseCard
              key={log.id}
              log={log}
              prescription={elderRx.find((p) => p.id === log.prescriptionId)!}
              nowStr={nowStr}
              onConfirm={() => confirmDose(log.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DoseCard({
  log,
  prescription,
  nowStr,
  onConfirm,
}: {
  log: MedicineLog;
  prescription: { medicineName: string; dose: string };
  nowStr: string;
  onConfirm: () => void;
}) {
  const isUpcoming = log.time > nowStr;
  const isMissed = log.status === "missed";
  const isTaken = log.status === "taken";
  const isTakenLate = log.status === "taken-late";
  const isDue = log.status === "due";
  const canConfirm = isDue || isMissed;

  return (
    <div
      className={`rounded-3xl p-5 border-2 transition-all ${
        isTaken || isTakenLate
          ? "bg-green-50 border-green-200"
          : isMissed
            ? "bg-red-50 border-red-200"
            : isUpcoming
              ? "bg-white border-gray-200"
              : "bg-amber-50 border-amber-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isTaken ? "bg-green-500" : isMissed ? "bg-red-500" : "bg-teal-500"
            } text-white`}
          >
            {isTaken || isTakenLate ? (
              <Check className="w-6 h-6" strokeWidth={3} />
            ) : (
              <Pill className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {prescription.medicineName}
            </p>
            <p className="text-sm text-gray-500">{prescription.dose}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{formatTime(log.time)}</span>
          </div>
          {isTaken && log.confirmedAt && (
            <p className="text-xs text-green-600 mt-0.5">
              Taken at {formatTime(toTimeStr(log.confirmedAt))}
            </p>
          )}
          {isTakenLate && log.confirmedAt && (
            <p className="text-xs text-orange-600 mt-0.5">
              Taken late at {formatTime(toTimeStr(log.confirmedAt))}
            </p>
          )}
          {isMissed && (
            <p className="text-xs text-red-600 mt-0.5 font-semibold">Missed</p>
          )}
          {isUpcoming && (
            <p className="text-xs text-gray-400 mt-0.5">Upcoming</p>
          )}
          {isDue && (
            <p className="text-xs text-amber-600 mt-0.5 font-semibold">Due</p>
          )}
        </div>
      </div>

      {canConfirm && (
        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 active:scale-[0.98] transition-all shadow-md shadow-teal-500/30 flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6" strokeWidth={3} />
          {isMissed ? "I Took It Later" : "I've Taken It"}
        </button>
      )}
      {isUpcoming && (
        <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold text-lg flex items-center justify-center gap-2 cursor-not-allowed">
          <Clock className="w-5 h-5" />
          Not yet time
        </div>
      )}
      {isTaken && (
        <div className="w-full py-3 rounded-2xl bg-green-100 text-green-700 font-bold text-base flex items-center justify-center gap-2">
          <Check className="w-5 h-5" strokeWidth={3} />
          Confirmed
        </div>
      )}
      {isTakenLate && (
        <div className="w-full py-3 rounded-2xl bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center gap-2">
          <Check className="w-5 h-5" strokeWidth={3} />
          Taken Late
        </div>
      )}
    </div>
  );
}

export const STICKER_EMOJI: Record<string, string> = {
  star: "⭐",
  trophy: "🏆",
  heart: "💖",
  thumbsup: "👍",
  cake: "🎉",
  flower: "🌸",
  clap: "👏",
  fire: "🔥",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

function toTimeStr(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
