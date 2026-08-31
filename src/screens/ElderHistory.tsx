import { useState } from 'react';
import { useApp } from '@/context';
import type { MedicineLog } from '@/types';
import { Check, X, Clock, Pill } from 'lucide-react';

export default function ElderHistory() {
  const { state, currentUser } = useApp();
  if (!currentUser) return null;
  const elderId = currentUser.id;

  const myLogs = state.logs.filter((l) => l.elderId === elderId);
  const myRx = state.prescriptions.filter((p) => p.elderId === elderId);

  // group by date desc
  const byDate = new Map<string, MedicineLog[]>();
  for (const log of myLogs) {
    if (!byDate.has(log.date)) byDate.set(log.date, []);
    byDate.get(log.date)!.push(log);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-5">History</h1>

      {dates.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">No history yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {dates.map((date) => {
            const logs = byDate.get(date)!.sort((a, b) => a.time.localeCompare(b.time));
            const taken = logs.filter((l) => l.status === 'taken').length;
            const missed = logs.filter((l) => l.status === 'missed').length;
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">{formatDate(date)}</h2>
                  <div className="flex gap-2 text-sm">
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Check className="w-4 h-4" /> {taken}
                    </span>
                    {missed > 0 && (
                      <span className="flex items-center gap-1 text-red-500 font-semibold">
                        <X className="w-4 h-4" /> {missed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {logs.map((log, i) => {
                    const rx = myRx.find((p) => p.id === log.prescriptionId);
                    return (
                      <div
                        key={log.id}
                        className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            log.status === 'taken'
                              ? 'bg-green-100 text-green-600'
                              : log.status === 'missed'
                              ? 'bg-red-100 text-red-500'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {log.status === 'taken' ? <Check className="w-5 h-5" strokeWidth={3} /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{rx?.medicineName ?? 'Medicine'}</p>
                          <p className="text-xs text-gray-400">{rx?.dose}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-600 text-sm">{formatTime(log.time)}</p>
                          {log.status === 'taken' && log.confirmedAt && (
                            <p className="text-xs text-green-500">{formatTime(toTimeStr(log.confirmedAt))}</p>
                          )}
                          {log.status === 'missed' && <p className="text-xs text-red-500 font-semibold">Missed</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

function toTimeStr(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
