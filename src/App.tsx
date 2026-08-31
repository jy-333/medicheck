import { useState } from 'react';
import { AppProvider, useApp } from '@/context';
import AuthScreen from '@/screens/AuthScreen';
import PairingScreen from '@/screens/PairingScreen';
import BottomNav, { type Tab } from '@/components/BottomNav';
import AppHeader from '@/components/AppHeader';
import MissedDoseAlarm from '@/components/MissedDoseAlarm';
import ElderHome from '@/screens/ElderHome';
import ElderHistory from '@/screens/ElderHistory';
import ElderWellness from '@/screens/ElderWellness';
import ElderFamily from '@/screens/ElderFamily';
import CaregiverHome from '@/screens/CaregiverHome';
import CaregiverHistory from '@/screens/CaregiverHistory';
import CaregiverWellness from '@/screens/CaregiverWellness';
import CaregiverFamily from '@/screens/CaregiverFamily';

function AppInner() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [showPairing, setShowPairing] = useState(false);

  if (!currentUser) {
    return <AuthScreen />;
  }

  if (showPairing) {
    return <PairingScreen onDone={() => setShowPairing(false)} />;
  }

  const isElder = currentUser.role === 'elder';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader onOpenPairing={() => setShowPairing(true)} />
      <main className="max-w-2xl mx-auto pb-20 min-h-screen">
        {isElder ? (
          <>
            {tab === 'home' && <ElderHome />}
            {tab === 'history' && <ElderHistory />}
            {tab === 'wellness' && <ElderWellness />}
            {tab === 'family' && <ElderFamily />}
          </>
        ) : (
          <>
            {tab === 'home' && <CaregiverHome onNavigate={setTab} />}
            {tab === 'history' && <CaregiverHistory />}
            {tab === 'wellness' && <CaregiverWellness />}
            {tab === 'family' && <CaregiverFamily />}
          </>
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} role={currentUser.role} />
      {isElder && <MissedDoseAlarm />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
