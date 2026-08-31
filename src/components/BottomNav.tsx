import { Home, History, Heart, Users } from 'lucide-react';
import type { Role } from '@/types';

export type Tab = 'home' | 'history' | 'wellness' | 'family';

export const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'history', label: 'History', icon: History },
  { id: 'wellness', label: 'Wellness', icon: Heart },
  { id: 'family', label: 'Family', icon: Users },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  role: Role;
}

export default function BottomNav({ active, onChange, role }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const label = role === 'caregiver' && tab.id === 'home' ? 'Dashboard' : tab.label;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? 'text-teal-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-7 h-7" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
