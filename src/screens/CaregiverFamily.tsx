import { useState } from 'react';
import { useApp, getElderId } from '@/context';
import { computeStreak } from '@/store';
import { STICKER_EMOJI } from './ElderHome';
import { Heart, Link2, Send, AlertTriangle, X, Gift } from 'lucide-react';
import type { Prescription } from '@/types';

const STICKER_OPTIONS = [
  { type: 'star', label: 'You\'re a star!' },
  { type: 'trophy', label: 'Champion!' },
  { type: 'heart', label: 'So proud of you!' },
  { type: 'thumbsup', label: 'Great job!' },
  { type: 'cake', label: 'Celebrate!' },
  { type: 'flower', label: 'You\'re blooming!' },
  { type: 'clap', label: 'Well done!' },
  { type: 'fire', label: 'On fire!' },
];

export default function CaregiverFamily() {
  const { state, currentUser, sendSticker } = useApp();
  if (!currentUser) return null;
  const elderId = getElderId(state, currentUser.id, currentUser.role);
  const elder = elderId ? state.users.find((u) => u.id === elderId) : null;

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [stickerMsg, setStickerMsg] = useState('');

  const elderLogs = elderId ? state.logs.filter((l) => l.elderId === elderId) : [];
  const streak = elderId ? computeStreak(state.prescriptions.filter((p) => p.elderId === elderId), elderLogs) : 0;

  // missed doses last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentMissed = elderId
    ? elderLogs
        .filter((l) => l.status === 'missed' && new Date(l.date + 'T00:00:00') >= weekAgo)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    : [];

  const sentStickers = elderId ? state.stickers.filter((s) => s.elderId === elderId).sort((a, b) => b.createdAt - a.createdAt) : [];

  const sendStickerNow = () => {
    if (!selectedSticker) return;
    const opt = STICKER_OPTIONS.find((o) => o.type === selectedSticker)!;
    sendSticker(opt.type, streak, stickerMsg.trim() || opt.label);
    setShowStickerPicker(false);
    setSelectedSticker(null);
    setStickerMsg('');
  };

  if (!elderId || !elder) {
    return (
      <div className="px-5 pt-6">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 text-center">
          <Link2 className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-bold text-amber-700 text-lg mb-1">No Elder paired yet</p>
          <p className="text-amber-600 text-sm mb-4">Enter your Elder's pairing code to connect.</p>
          <PairingForm />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-5">Family</h1>

      {/* Elder card */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-teal-500/20 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm opacity-80">Paired with</p>
            <p className="text-xl font-bold">{elder.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-white/15 rounded-xl px-3 py-1.5 font-semibold">{streak} day streak</span>
          <span className="bg-white/15 rounded-xl px-3 py-1.5 font-semibold">{recentMissed.length} missed (7d)</span>
        </div>
      </div>

      {/* Send sticker */}
      <button
        onClick={() => setShowStickerPicker(true)}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-pink-500/20 mb-5 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Gift className="w-7 h-7" />
        </div>
        <div className="text-left">
          <p className="font-bold text-lg">Send a Sticker</p>
          <p className="text-sm opacity-80">Celebrate {elder.name.split(' ')[0]}'s progress</p>
        </div>
      </button>

      {/* Missed doses */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Missed Doses</h2>
      {recentMissed.length === 0 ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-2">
          <Heart className="w-5 h-5 text-green-500" />
          <p className="text-green-700 font-semibold text-sm">No missed doses in the last 7 days. Great!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5">
          {recentMissed.map((m, i) => {
            const rx = state.prescriptions.find((p) => p.id === m.prescriptionId);
            return (
              <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{rx?.medicineName ?? 'Medicine'}</p>
                  <p className="text-xs text-gray-400">{formatDate(m.date)} at {formatTime(m.time)}</p>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Missed</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Sent stickers history */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Stickers Sent</h2>
      {sentStickers.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <Gift className="w-8 h-8 text-gray-300 mx-auto mb-1" />
          <p className="text-gray-400 text-sm">No stickers sent yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sentStickers.map((s) => (
            <div key={s.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4 text-center">
              <p className="text-4xl mb-1">{STICKER_EMOJI[s.type] ?? '🎉'}</p>
              <p className="font-semibold text-rose-700 text-sm">{s.message}</p>
              <p className="text-xs text-rose-400 mt-0.5">{formatDateShort(s.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sticker picker modal */}
      {showStickerPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={() => setShowStickerPicker(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Send a Sticker</h2>
              <button onClick={() => setShowStickerPicker(false)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {STICKER_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setSelectedSticker(opt.type)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                    selectedSticker === opt.type ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{STICKER_EMOJI[opt.type]}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={stickerMsg}
              onChange={(e) => setStickerMsg(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none mb-4"
            />
            <button
              onClick={sendStickerNow}
              disabled={!selectedSticker}
              className="w-full py-3.5 rounded-xl bg-pink-500 text-white font-bold text-base hover:bg-pink-600 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/30 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Sticker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PairingForm() {
  const { pairByCode } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pair = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = pairByCode(code.trim());
    if (err) setError(err);
  };

  return (
    <form onSubmit={pair} className="space-y-3 mt-4">
      <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Elder's pairing code"
        className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none font-mono" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all">
        Link Accounts
      </button>
    </form>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDate(d: string): string {
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
