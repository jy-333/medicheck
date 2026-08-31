import { useState } from 'react';
import { useApp } from '@/context';
import { Link2, Copy, Check, ArrowLeft } from 'lucide-react';

export default function PairingScreen({ onDone }: { onDone: () => void }) {
  const { currentUser, getPairingCode, pairByCode, state } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const myCode = getPairingCode();
  const existingPairing = state.pairings.find(
    (p) => p.elderId === currentUser?.id || p.caregiverId === currentUser?.id
  );

  const handlePair = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = pairByCode(code.trim());
    if (err) {
      setError(err);
    } else {
      onDone();
    }
  };

  const copyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <button onClick={onDone} className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-7 border border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 mb-4">
            <Link2 className="w-8 h-8" />
          </div>

          {currentUser?.role === 'elder' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Pairing Code</h2>
              <p className="text-gray-500 mb-5">
                Share this code with your Caregiver so they can link to your account and help watch over your medicines.
              </p>

              {existingPairing ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">You're paired with your Caregiver!</p>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Code</p>
                  <p className="text-2xl font-mono font-bold text-gray-800 break-all mb-3">{myCode}</p>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pair with an Elder</h2>
              <p className="text-gray-500 mb-5">
                Enter the pairing code your Elder shared with you to connect your accounts.
              </p>

              {existingPairing ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center mb-4">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">You're paired with your Elder!</p>
                </div>
              ) : (
                <form onSubmit={handlePair} className="space-y-4">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste the Elder's code here"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-500 focus:outline-none text-base font-mono"
                  />
                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-bold text-base hover:bg-sky-600 active:scale-[0.98] transition-all shadow-lg shadow-sky-500/30"
                  >
                    Link Accounts
                  </button>
                </form>
              )}
            </>
          )}

          <button
            onClick={onDone}
            className="w-full mt-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all"
          >
            {existingPairing ? 'Continue' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  );
}
