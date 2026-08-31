import { useState } from 'react';
import { useApp } from '@/context';
import { todayStr } from '@/context';
import { Smile, Meh, Frown, Check } from 'lucide-react';

const SYMPTOMS = [
  'Pain',
  'Dizziness',
  'Nausea',
  'Trouble sleeping',
  'Headache',
  'Fatigue',
  'Shortness of breath',
  'Stomach upset',
  'Joint stiffness',
  'Dry mouth',
];

type Feeling = 'good' | 'okay' | 'bad';

export default function ElderWellness() {
  const { state, currentUser, addCheckIn } = useApp();
  if (!currentUser) return null;
  const elderId = currentUser.id;

  const today = todayStr();
  const existing = state.checkIns.find((c) => c.elderId === elderId && c.date === today);

  const [feeling, setFeeling] = useState<Feeling | null>(existing?.feeling ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    setSaved(false);
  };

  const save = () => {
    if (!feeling) return;
    addCheckIn({
      elderId,
      date: today,
      feeling,
      symptoms,
      note: note.trim(),
    });
    setSaved(true);
  };

  const feelings: { id: Feeling; label: string; icon: typeof Smile; color: string; bg: string }[] = [
    { id: 'good', label: 'Good', icon: Smile, color: 'text-green-600', bg: 'bg-green-50 border-green-400' },
    { id: 'okay', label: 'Okay', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-400' },
    { id: 'bad', label: 'Bad', icon: Frown, color: 'text-red-500', bg: 'bg-red-50 border-red-400' },
  ];

  // history
  const myCheckIns = state.checkIns
    .filter((c) => c.elderId === elderId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">How do you feel?</h1>
      <p className="text-gray-500 mb-5">Daily check-in for {formatDate(today)}</p>

      {/* Feeling selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {feelings.map((f) => {
          const Icon = f.icon;
          const selected = feeling === f.id;
          return (
            <button
              key={f.id}
              onClick={() => { setFeeling(f.id); setSaved(false); }}
              className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all ${
                selected ? `${f.bg} scale-105` : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-12 h-12 ${selected ? f.color : 'text-gray-300'}`} strokeWidth={1.5} />
              <span className={`font-bold ${selected ? f.color : 'text-gray-400'}`}>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Symptoms */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Any symptoms?</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        {SYMPTOMS.map((s) => {
          const selected = symptoms.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`px-4 py-2.5 rounded-full font-medium text-sm border-2 transition-all ${
                selected
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {selected && <Check className="w-4 h-4 inline mr-1" />}
              {s}
            </button>
          );
        })}
      </div>

      {/* Note */}
      <h2 className="text-lg font-bold text-gray-900 mb-2">Anything else?</h2>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder="Write a note about how you're feeling..."
        rows={3}
        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-base resize-none mb-4"
      />

      <button
        onClick={save}
        disabled={!feeling}
        className="w-full py-4 rounded-2xl bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 active:scale-[0.98] transition-all shadow-md shadow-teal-500/30 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
      >
        {saved ? 'Saved!' : 'Save Check-In'}
      </button>

      {/* History */}
      {myCheckIns.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Your Wellness Diary</h2>
          <div className="space-y-2">
            {myCheckIns.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feelingColor(c.feeling)}`}>
                  {c.feeling === 'good' ? <Smile className="w-6 h-6 text-green-600" /> : c.feeling === 'okay' ? <Meh className="w-6 h-6 text-amber-500" /> : <Frown className="w-6 h-6 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{formatDate(c.date)}</p>
                  {c.symptoms.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">{c.symptoms.join(', ')}</p>
                  )}
                  {c.note && <p className="text-sm text-gray-400 mt-1 italic">"{c.note}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function feelingColor(f: Feeling): string {
  return f === 'good' ? 'bg-green-100' : f === 'okay' ? 'bg-amber-100' : 'bg-red-100';
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
