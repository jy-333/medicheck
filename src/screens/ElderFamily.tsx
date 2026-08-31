import { useApp } from '@/context';
import { STICKER_EMOJI } from './ElderHome';
import { Link2, Volume2, Play, Heart } from 'lucide-react';
import { useState } from 'react';

export default function ElderFamily() {
  const { state, currentUser } = useApp();
  if (!currentUser) return null;
  const elderId = currentUser.id;

  const pairing = state.pairings.find((p) => p.elderId === elderId);
  const caregiver = pairing ? state.users.find((u) => u.id === pairing.caregiverId) : null;
  const myStickers = state.stickers.filter((s) => s.elderId === elderId).sort((a, b) => b.createdAt - a.createdAt);
  const myVoiceNotes = state.voiceNotes.filter((n) => n.elderId === elderId).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-5">Family</h1>

      {/* Caregiver card */}
      <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-3xl p-5 text-white shadow-lg shadow-sky-500/20 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm opacity-80">Your Caregiver</p>
            <p className="text-xl font-bold">{caregiver?.name ?? 'Not paired yet'}</p>
          </div>
        </div>
        {!pairing && (
          <div className="mt-3 bg-white/10 rounded-2xl p-3 flex items-center gap-2">
            <Link2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">Go to your pairing code in Settings to connect with a caregiver.</p>
          </div>
        )}
      </div>

      {/* Voice notes */}
      {myVoiceNotes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Voice Reminders</h2>
          <div className="space-y-2">
            {myVoiceNotes.map((n) => (
              <VoiceNotePlayer key={n.id} note={n} caregiverName={caregiver?.name} />
            ))}
          </div>
        </div>
      )}

      {/* Stickers */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Stickers Received</h2>
      {myStickers.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <Heart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">No stickers yet. Keep taking your medicines!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {myStickers.map((s) => (
            <div key={s.id} className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-3xl p-5 text-center">
              <p className="text-5xl mb-2">{STICKER_EMOJI[s.type] ?? '🎉'}</p>
              <p className="font-bold text-rose-700">{s.message}</p>
              <p className="text-xs text-rose-400 mt-1">{s.milestone} day streak!</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceNotePlayer({ note, caregiverName }: { note: { dataUrl: string; label: string; createdAt: number }; caregiverName?: string }) {
  const [playing, setPlaying] = useState(false);
  const play = () => {
    const audio = new Audio(note.dataUrl);
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
      <button
        onClick={play}
        className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 hover:bg-teal-600 transition-all"
      >
        {playing ? <Volume2 className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{note.label}</p>
        <p className="text-xs text-gray-400">From {caregiverName ?? 'Caregiver'}</p>
      </div>
    </div>
  );
}
