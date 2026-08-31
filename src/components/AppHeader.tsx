import { useApp } from '@/context';
import { LogOut, Settings, Link2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onOpenPairing: () => void;
}

export default function AppHeader({ onOpenPairing }: Props) {
  const { currentUser, signOut, state } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  if (!currentUser) return null;

  const hasPairing = state.pairings.some(
    (p) => p.elderId === currentUser.id || p.caregiverId === currentUser.id
  );

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
            {currentUser.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">{currentUser.name}</p>
            <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <div className="absolute right-5 top-14 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 w-48">
            <button
              onClick={() => { onOpenPairing(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              <Link2 className="w-4 h-4" />
              {hasPairing ? 'Pairing' : 'Pair with someone'}
            </button>
            <button
              onClick={() => { signOut(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </header>
  );
}
