import { useState } from 'react';
import { useApp } from '@/context';
import type { Role } from '@/types';
import { Pill, Heart, Shield, User as UserIcon } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('elder');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
      }
      const err = signUp(name.trim(), email.trim(), password.trim(), role);
      if (err) setError(err);
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }
      const err = signIn(email.trim(), password.trim());
      if (err) setError(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-teal-500 text-white shadow-lg shadow-teal-500/30 mb-4">
            <Pill className="w-10 h-10" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MediCheck</h1>
          <p className="text-gray-500 mt-1.5 text-lg">Your medicine, made simple.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-7 border border-gray-100">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-base transition-all ${
                mode === 'signin' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-base transition-all ${
                mode === 'signup' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mary Johnson"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-base"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-base"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('elder')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      role === 'elder'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <UserIcon className="w-7 h-7" />
                    <span className="font-semibold text-sm">Elder</span>
                    <span className="text-xs text-gray-400 text-center">I take medicines</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('caregiver')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      role === 'caregiver'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Heart className="w-7 h-7" />
                    <span className="font-semibold text-sm">Caregiver</span>
                    <span className="text-xs text-gray-400 text-center">I look after someone</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-teal-500 text-white font-bold text-base hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Prototype — your data is stored only on this device.
        </p>
      </div>
    </div>
  );
}
