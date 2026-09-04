import { useState } from "react";
import { useApp, getElderId, todayStr } from "@/context";
import { daysOfSupplyRemaining } from "@/store";
import type { Prescription } from "@/types";
import {
  Plus,
  Pill,
  Square,
  Edit3,
  X,
  Check,
  Clock,
  ShoppingCart,
  Mic,
  MicOff,
  Play,
  Volume2,
} from "lucide-react";

export default function CaregiverHistory() {
  const { state, currentUser, stopPrescription, restock, addVoiceNote } =
    useApp();
  if (!currentUser) return null;
  const elderId = getElderId(state, currentUser.id, currentUser.role);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [reordering, setReordering] = useState<Prescription | null>(null);
  const [recording, setRecording] = useState<Prescription | null>(null);

  const elderLogs = elderId
    ? state.logs.filter((l) => l.elderId === elderId)
    : [];
  const allRx = elderId
    ? state.prescriptions.filter((p) => p.elderId === elderId)
    : [];

  // group logs by date
  const byDate = new Map<string, typeof elderLogs>();
  for (const log of elderLogs) {
    if (!byDate.has(log.date)) byDate.set(log.date, []);
    byDate.get(log.date)!.push(log);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        {elderId && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 hover:bg-teal-600 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {!elderId ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-gray-400 font-medium">
            Pair with an Elder first to manage medicines.
          </p>
        </div>
      ) : (
        <>
          {/* Active prescriptions */}
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Active Prescriptions
          </h2>
          <div className="space-y-3 mb-6">
            {allRx.filter((p) => p.active).length === 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <Pill className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-gray-400 text-sm">
                  No active prescriptions. Tap + to add one.
                </p>
              </div>
            )}
            {allRx
              .filter((p) => p.active)
              .map((p) => {
                const days = daysOfSupplyRemaining(p, elderLogs);
                const low = days <= 3;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-3xl border-2 p-4 ${low ? "border-amber-300" : "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
                          <Pill className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {p.medicineName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {p.dose} · {p.timesPerDay}x/day
                          </p>
                        </div>
                      </div>
                      {low && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                          Low stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />{" "}
                        {p.times.map(formatTime).join(", ")}
                      </span>
                      <span>{days} days left</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setEditing(p)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-all"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => stopPrescription(p.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
                      >
                        <Square className="w-4 h-4" /> Stop
                      </button>
                      <button
                        onClick={() => setReordering(p)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-50 text-green-600 font-semibold text-sm hover:bg-green-100 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" /> Order more
                      </button>
                      <button
                        onClick={() => setRecording(p)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-50 text-sky-600 font-semibold text-sm hover:bg-sky-100 transition-all"
                      >
                        <Mic className="w-4 h-4" /> Voice note
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Stopped prescriptions */}
          {allRx.filter((p) => !p.active).length > 0 && (
            <>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Stopped
              </h2>
              <div className="space-y-2 mb-6">
                {allRx
                  .filter((p) => !p.active)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3 opacity-60"
                    >
                      <Pill className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-500">
                        {p.medicineName}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Log history */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Medicine Log History
          </h2>
          <div className="space-y-3">
            {dates.slice(0, 14).map((date) => {
              const logs = byDate
                .get(date)!
                .sort((a, b) => a.time.localeCompare(b.time));
              const taken = logs.filter((l) => l.status === "taken").length;
              const takenLate = logs.filter((l) => l.status === "taken-late").length;
              const missed = logs.filter((l) => l.status === "missed").length;
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-gray-800">
                      {formatDate(date)}
                    </h3>
                    <div className="flex gap-2 text-sm">
                      <span className="text-green-600 font-semibold">
                        {taken} taken
                      </span>
                      {takenLate > 0 && (
                        <span className="text-orange-600 font-semibold">
                          {takenLate} taken late
                        </span>
                      )}
                      {missed > 0 && (
                        <span className="text-red-500 font-semibold">
                          {missed} missed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {logs.map((log, i) => {
                      const rx = allRx.find((p) => p.id === log.prescriptionId);
                      return (
                        <div
                          key={log.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              log.status === "taken"
                                ? "bg-green-100 text-green-600"
                                : log.status === "taken-late"
                                  ? "bg-orange-100 text-orange-600"
                                : log.status === "missed"
                                  ? "bg-red-100 text-red-500"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {log.status === "taken" || log.status === "taken-late" ? (
                              <Check className="w-4 h-4" strokeWidth={3} />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700 text-sm flex-1 truncate">
                            {rx?.medicineName ?? "Medicine"}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {formatTime(log.time)}
                          </span>
                          {log.status === "taken-late" && (
                            <span className="text-orange-600 text-xs font-semibold">
                              Taken Late
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      {(showAdd || editing) && (
        <PrescriptionForm
          editing={editing}
          elderId={elderId!}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
        />
      )}

      {/* Reorder modal */}
      {reordering && (
        <ReorderModal
          rx={reordering}
          onClose={() => setReordering(null)}
          onRestock={(n) => {
            restock(reordering.id, n);
            setReordering(null);
          }}
        />
      )}

      {/* Voice note recorder */}
      {recording && (
        <VoiceNoteRecorder
          onClose={() => setRecording(null)}
          onSave={(dataUrl, label) => {
            addVoiceNote(dataUrl, label, recording.id);
            setRecording(null);
          }}
        />
      )}
    </div>
  );
}

// ---- Prescription Form ----

function PrescriptionForm({
  editing,
  elderId,
  onClose,
}: {
  editing: Prescription | null;
  elderId: string;
  onClose: () => void;
}) {
  const { addPrescription, updatePrescription } = useApp();
  const [name, setName] = useState(editing?.medicineName ?? "");
  const [dose, setDose] = useState(editing?.dose ?? "1 tablet");
  const [times, setTimes] = useState<string[]>(
    editing?.times?.length ? editing.times : ["08:00", "20:00"],
  );
  const [isLongTerm, setIsLongTerm] = useState(editing?.isLongTerm ?? false);
  const [days, setDays] = useState(editing?.days ?? 30);
  const [totalDoses, setTotalDoses] = useState(editing?.totalDoses ?? 60);
  const [startDate, setStartDate] = useState(editing?.startDate ?? todayStr());
  const timesPerDay = times.length;

  const addTime = () => {
    const suggestedTimes = ["08:00", "12:00", "18:00", "20:00", "22:00"];
    const nextTime =
      suggestedTimes[times.length] ?? times[times.length - 1] ?? "08:00";
    setTimes([...times, nextTime]);
  };

  const removeTime = (index: number) => {
    if (times.length === 1) return;
    setTimes(times.filter((_, i) => i !== index));
  };

  const save = () => {
    if (!name.trim()) return;
    const normalizedDays = isLongTerm ? Math.max(days, 30) : days;
    const prescriptionData = {
      medicineName: name.trim(),
      dose,
      timesPerDay,
      times,
      days: normalizedDays,
      isLongTerm,
      totalDoses,
      startDate,
    };
    if (editing) {
      updatePrescription(editing.id, {
        ...prescriptionData,
      });
    } else {
      addPrescription({
        elderId,
        ...prescriptionData,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {editing ? "Edit Prescription" : "New Prescription"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Medicine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dose
            </label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 1 tablet"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Times per day
              </label>
              <div className="flex h-[52px] w-full items-center px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                {timesPerDay}x
              </div>
            </div>
            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Duration
              </label>
              <div className="flex h-[52px] w-full items-center rounded-xl border-2 border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsLongTerm(false)}
                  className={`flex-1 h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    !isLongTerm
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  Days
                </button>
                <button
                  type="button"
                  onClick={() => setIsLongTerm(true)}
                  className={`flex-1 h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    isLongTerm
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  Long-term
                </button>
              </div>
            </div>
          </div>
          {!isLongTerm && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Days
              </label>
              <input
                type="number"
                value={days}
                min={1}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}
          {isLongTerm && (
            <div className="rounded-xl border-2 border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
              This prescription will continue until the caregiver stops it.
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Times
            </label>
            <div className="space-y-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => {
                      const nt = [...times];
                      nt[i] = e.target.value;
                      setTimes(nt);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    disabled={times.length === 1}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                    aria-label={`Remove time ${i + 1}`}
                  >
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTime}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-teal-200 text-teal-600 font-semibold hover:border-teal-300 hover:bg-teal-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add another time
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Total Pills Supply
              </label>
              <input
                type="number"
                value={totalDoses}
                min={1}
                onChange={(e) => setTotalDoses(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={!name.trim()}
          className="w-full mt-5 py-3.5 rounded-xl bg-teal-500 text-white font-bold text-base hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
        >
          {editing ? "Save Changes" : "Add Prescription"}
        </button>
      </div>
    </div>
  );
}

// ---- Reorder Modal ----

function ReorderModal({
  rx,
  onClose,
  onRestock,
}: {
  rx: Prescription;
  onClose: () => void;
  onRestock: (n: number) => void;
}) {
  const [restockAmount, setRestockAmount] = useState(30);
  const grabUrl = "https://grab.com/pharmacy";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Order {rx.medicineName}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <a
          href={grabUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 hover:bg-green-100 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center font-bold text-lg">
            G
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-700">Order via Grab</p>
            <p className="text-sm text-green-600">
              Opens Grab pharmacy delivery
            </p>
          </div>
          <ShoppingCart className="w-6 h-6 text-green-600" />
        </a>

        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="font-semibold text-gray-700 mb-3">Mark as restocked</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={restockAmount}
              min={1}
              onChange={(e) => setRestockAmount(Number(e.target.value))}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none"
            />
            <span className="text-gray-500 font-medium text-sm">pills</span>
          </div>
          <button
            onClick={() => onRestock(restockAmount)}
            className="w-full py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-all"
          >
            Mark Restocked
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Voice Note Recorder ----

function VoiceNoteRecorder({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (dataUrl: string, label: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [chunks, setChunks] = useState<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const collected: Blob[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) collected.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(collected, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => setAudioUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setChunks(collected);
      setRecording(true);
    } catch {
      setError("Microphone access denied. Please allow it in your browser.");
    }
  };

  const stop = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const save = () => {
    if (audioUrl) onSave(audioUrl, label.trim() || "Voice reminder");
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Record Voice Reminder
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center py-6">
          <button
            onClick={recording ? stop : start}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${recording ? "bg-red-500 animate-pulse" : "bg-teal-500"} text-white shadow-lg`}
          >
            {recording ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
          <p className="text-gray-500 font-medium mt-3">
            {recording ? "Recording... tap to stop" : "Tap to start recording"}
          </p>
        </div>

        {audioUrl && !recording && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. 'Take with food')"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none mb-4"
        />

        <button
          onClick={save}
          disabled={!audioUrl}
          className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-bold text-base hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
        >
          Save Voice Note
        </button>
      </div>
    </div>
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
