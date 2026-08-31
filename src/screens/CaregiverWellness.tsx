import { useApp, getElderId } from '@/context';
import { Smile, Meh, Frown, AlertTriangle, Link2 } from 'lucide-react';
import type { CheckIn } from '@/types';

export default function CaregiverWellness() {
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
          <p className="text-amber-600 text-sm">Pair with an Elder to see their wellness check-ins.</p>
        </div>
      </div>
    );
  }

  const checkIns = state.checkIns
    .filter((c) => c.elderId === elderId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const badDays = checkIns.filter((c) => c.feeling === 'bad' || c.symptoms.length > 0);

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Wellness</h1>
      <p className="text-gray-500 mb-5">{elder.name}'s check-ins</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <Smile className="w-7 h-7 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{checkIns.filter((c) => c.feeling === 'good').length}</p>
          <p className="text-xs text-green-600">good days</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <Meh className="w-7 h-7 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{checkIns.filter((c) => c.feeling === 'okay').length}</p>
          <p className="text-xs text-amber-600">okay days</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <Frown className="w-7 h-7 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{checkIns.filter((c) => c.feeling === 'bad').length}</p>
          <p className="text-xs text-red-600">bad days</p>
        </div>
      </div>

      {/* Concerns */}
      {badDays.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="font-bold text-red-700">Days to watch</p>
          </div>
          <p className="text-red-600 text-sm">{badDays.length} day(s) marked as bad or with symptoms. Follow up with {elder.name.split(' ')[0]}.</p>
        </div>
      )}

      {/* Timeline */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Timeline</h2>
      {checkIns.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <Smile className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 font-medium">No check-ins yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkIns.map((c) => (
            <CheckInCard key={c.id} checkIn={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  const isBad = checkIn.feeling === 'bad' || checkIn.symptoms.length > 0;
  const config = {
    good: { icon: Smile, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    okay: { icon: Meh, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
    bad: { icon: Frown, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-200' },
  }[checkIn.feeling];
  const Icon = config.icon;

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 ${isBad ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-800">{formatDate(checkIn.date)}</p>
            <span className={`text-sm font-semibold ${config.color}`}>{checkIn.feeling}</span>
          </div>
          {checkIn.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {checkIn.symptoms.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {checkIn.note && <p className="text-sm text-gray-500 mt-2 italic">"{checkIn.note}"</p>}
        </div>
      </div>
    </div>
  );
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
