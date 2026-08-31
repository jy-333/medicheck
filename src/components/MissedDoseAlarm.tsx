import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context";
import type { VoiceNote } from "@/types";
import {
  AlertTriangle,
  X,
  Check,
  Volume2,
  Play,
  RefreshCw,
} from "lucide-react";

export default function MissedDoseAlarm() {
  const { state, currentUser, acknowledgeAlert } = useApp();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [usingVoiceNote, setUsingVoiceNote] = useState(false);
  const [voiceNoteLabel, setVoiceNoteLabel] = useState<string | null>(null);

  const elderId = currentUser?.role === "elder" ? currentUser.id : null;

  const activeAlerts = elderId
    ? state.alerts.filter(
        (a) => a.elderId === elderId && !a.acknowledged && !dismissed.has(a.id),
      )
    : [];

  const alert = activeAlerts[0] ?? null;

  // Find the voice note for this alert's specific prescription.
  const findVoiceNote = (): VoiceNote | null => {
    if (!elderId) return null;
    const elderNotes = state.voiceNotes.filter((n) => n.elderId === elderId);
    if (alert) {
      const match = elderNotes.find(
        (n) => n.prescriptionId === alert.prescriptionId,
      );
      if (match) return match;
    }
    return null;
  };

  const playBeepLoop = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, now + i * 0.5);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.5 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.5 + 0.35);
        osc.start(now + i * 0.5);
        osc.stop(now + i * 0.5 + 0.4);
      }
    } catch {
      // audio not available
    }
  };

  const playVoiceNote = (note: VoiceNote) => {
    // stop any existing audio
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
    const audio = new Audio(note.dataUrl);
    audio.loop = true;
    audio.volume = 1.0;
    voiceAudioRef.current = audio;
    audio.play().catch(() => {
      // fallback to beep if autoplay blocked
      playBeepLoop();
    });
    setUsingVoiceNote(true);
    setVoiceNoteLabel(note.label);
  };

  const stopAllAudio = () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
    setUsingVoiceNote(false);
    setVoiceNoteLabel(null);
  };

  // play alarm when a new alert appears
  useEffect(() => {
    if (!alert) {
      stopAllAudio();
      return;
    }

    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);

    const note = findVoiceNote();
    if (note) {
      playVoiceNote(note);
    } else {
      // no voice note — beep pattern, repeat every 2.5s
      playBeepLoop();
      const interval = setInterval(playBeepLoop, 2500);
      return () => clearInterval(interval);
    }

    return () => stopAllAudio();
  }, [alert?.id]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
    };
  }, []);

  if (!alert) return null;

  const dismiss = () => {
    stopAllAudio();
    acknowledgeAlert(alert.id);
    setDismissed((prev) => new Set(prev).add(alert.id));
  };

  const replay = () => {
    const note = findVoiceNote();
    if (note) {
      playVoiceNote(note);
    } else {
      playBeepLoop();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-red-600/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-bounce">
        <AlertTriangle className="w-14 h-14 text-white" strokeWidth={2.5} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">Medicine Reminder</h2>
      <p className="text-xl text-white/90 mb-1">{alert.medicineName}</p>
      <p className="text-lg text-white/70 mb-6">
        Was due at {formatTime(alert.time)}
      </p>

      {/* Voice note indicator */}
      {usingVoiceNote ? (
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2.5">
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-semibold text-sm">
              Playing voice reminder from your Caregiver
            </span>
          </div>
          {voiceNoteLabel && (
            <p className="text-white/70 text-sm italic">"{voiceNoteLabel}"</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-white/80 mb-6">
          <Volume2 className="w-5 h-5" />
          <span className="text-sm">Playing alarm sound</span>
        </div>
      )}

      {/* Replay button */}
      <button
        onClick={replay}
        className="mb-4 flex items-center gap-2 text-white/80 text-sm font-medium bg-white/10 rounded-xl px-4 py-2 hover:bg-white/20 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Replay alarm
      </button>

      <button
        onClick={dismiss}
        className="w-full max-w-xs py-5 rounded-2xl bg-white text-red-600 font-bold text-xl hover:bg-red-50 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
      >
        <Check className="w-7 h-7" strokeWidth={3} />I Acknowledge
      </button>

      <button
        onClick={dismiss}
        className="mt-3 text-white/70 font-medium flex items-center gap-1"
      >
        <X className="w-5 h-5" />
        Dismiss
      </button>
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}
