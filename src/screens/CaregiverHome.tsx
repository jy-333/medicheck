import { useApp, getElderId } from '@/context';
import { getTodaySchedule, computeStreak, dosesRemaining, daysOfSupplyRemaining, todayStr } from '@/store';
import { AlertTriangle, Flame, Check, X, Pill, TrendingUp, Link2 } from 'lucide-react';

export default function CaregiverHome({ onNavigate }: { onNavigate: (tab: 'history' | 'wellness' | 'family') => void }) {
  const { state, currentUser } = useApp();
  if (!currentUser) return null;
  const elderId = getElderId(state, currentUser.id, currentUser.role);
  const elder = elderId ? state.users.find((u) => u.id === elderId) : null;

  if (!elderId || !elder) {
    return (
      <div className="px-5 pt-6">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 text-center">
          <Link2 className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-bold text-amber-700 text-lg mb-1">No Elder paired yet</p>
          <p className="text-amber-600 text-sm">Go to the Family tab to pair with an Elder.</p>
        </div>
      </div>
    );
  }

  const elderRx = state.prescriptions.filter((p) => p.elderId === elderId && p.active);
  const elderLogs = state.logs.filter((l) => l.elderId === elderId);
  const schedule = getTodaySchedule(state.prescriptions, state.logs);
  const streak = computeStreak(state.prescriptions.filter((p) => p.elderId === elderId), elderLogs);
  const takenCount = schedule.filter((l) => l.status === 'taken').length;
  const missedToday = schedule.filter((l) => l.status === 'missed');

  // missed doses (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentMissed = elderLogs
    .filter((l) => l.status === 'missed' && new Date(l.date + 'T00:00:00') >= weekAgo)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  // low stock
  const lowStock = elderRx.filter((p) => daysOfSupplyRemaining(p, elderLogs) <= 3);

  return (
    <div className="px-5 pt-6 pb-4">
      <p className="text-gray-400 text-sm font-medium">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Caring for {elder.name.split(' ')[0]}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 mt-4">
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-white">
          <Flame className="w-6 h-6 mb-1" />
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs opacity-80">day streak</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
          <Check className="w-6 h-6 mb-1" />
          <p className="text-2xl font-bold">{takenCount}/{schedule.length}</p>
          <p className="text-xs opacity-80">today</p>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-4 text-white">
          <AlertTriangle className="w-6 h-6 mb-1" />
          <p className="text-2xl font-bold">{recentMissed.length}</p>
          <p className="text-xs opacity-80">missed (7d)</p>
        </div>
      </div>

      {/* Missed doses alert */}
      {missedToday.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="font-bold text-red-700">Missed Doses Today</p>
          </div>
          {missedToday.map((m) => {
            const rx = elderRx.find((p) => p.id === m.prescriptionId);
            return (
              <div key={m.id} className="flex items-center gap-2 text-red-600 text-sm py-1">
                <X className="w-4 h-4 shrink-0" />
                <span>{rx?.medicineName ?? 'Medicine'}</span>
                <span className="text-red-400">at {formatTime(m.time)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <p className="font-bold text-amber-700">Running Low</p>
          </div>
          {lowStock.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-amber-700 text-sm py-1">
              <span>{p.medicineName}</span>
              <span className="font-semibold">{daysOfSupplyRemaining(p, elderLogs)} days left</span>
            </div>
          ))}
        </div>
      )}

      {/* Today's schedule */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Today's Schedule</h2>
      {schedule.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <Pill className="w-8 h-8 text-gray-300 mx-auto mb-1" />
          <p className="text-gray-400 text-sm">No medicines scheduled today.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5">
          {schedule.map((log, i) => {
            const rx = elderRx.find((p) => p.id === log.prescriptionId);
            return (
              <div key={log.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  log.status === 'taken' ? 'bg-green-100 text-green-600' : log.status === 'missed' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {log.status === 'taken' ? <Check className="w-5 h-5" strokeWidth={3} /> : <Pill className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{rx?.medicineName ?? 'Medicine'}</p>
                  <p className="text-xs text-gray-400">{rx?.dose}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-600 text-sm">{formatTime(log.time)}</p>
                  <p className={`text-xs font-semibold ${log.status === 'taken' ? 'text-green-500' : log.status === 'missed' ? 'text-red-500' : 'text-gray-400'}`}>
                    {log.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('wellness')} className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-teal-300 transition-all">
          <p className="font-bold text-gray-800">Wellness</p>
          <p className="text-xs text-gray-400">View check-ins</p>
        </button>
        <button onClick={() => onNavigate('history')} className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-teal-300 transition-all">
          <p className="font-bold text-gray-800">History</p>
          <p className="text-xs text-gray-400">Medicine logs</p>
        </button>
      </div>
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}
