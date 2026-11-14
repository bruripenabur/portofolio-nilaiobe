import { useEffect, useState } from 'react';
import { checkSupabaseConnection, supabase } from '../lib/supabase';

export function SupabaseStatusBadge() {
  const [status, setStatus] = useState<{
    state: 'checking' | 'connected' | 'error';
    message: string;
  }>({
    state: 'checking',
    message: 'Memeriksa Supabase...',
  });

  useEffect(() => {
    let active = true;

    const runCheck = () => {
      void checkSupabaseConnection().then((res) => {
        if (!active) return;
        if (res.connected) {
          setStatus({ state: 'connected', message: res.message });
        } else {
          setStatus({ state: 'error', message: res.message });
        }
      });
    };

    runCheck();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      runCheck();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status.state === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 z-30 no-print bg-slate-900/90 text-slate-200 border border-slate-700 rounded-full px-3 py-1.5 text-[11px] font-medium shadow-md">
        Memeriksa koneksi Supabase...
      </div>
    );
  }

  if (status.state === 'connected') {
    return (
      <div
        title={status.message}
        className="fixed bottom-4 right-4 z-30 no-print bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-md flex items-center gap-1.5"
      >
        <span aria-hidden="true">🟢</span>
        <span>Supabase Connected (SIMPEL-OBE DB)</span>
      </div>
    );
  }

  return (
    <div
      title={status.message}
      className="fixed bottom-4 right-4 z-30 no-print bg-red-50 text-red-900 border border-red-300 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-md flex items-center gap-1.5 max-w-xs truncate"
    >
      <span aria-hidden="true">🔴</span>
      <span className="truncate">Supabase Error: {status.message}</span>
    </div>
  );
}
