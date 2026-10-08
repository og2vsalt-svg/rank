import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Row = { id: string; errand?: string | null; for_whom?: string | null; file_name?: string | null; size?: number; author?: string | null; picked_up?: boolean };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CloakroomPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    const res = await fetch('/api/courier');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'could not read the cloakroom'); return; }
    setRows(data.couriers || []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(row: Row) {
    setBusy(row.id);
    await fetch('/api/courier', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, picked_up: !row.picked_up }) });
    await load();
    setBusy('');
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#ff9f0a]/80">cloakroom</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Couriers waiting to be collected.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl">A public board, not a vault drawer. Open a run to download the file, or mark it picked up. Discord unfurls this page.</p>
        <button onClick={() => navigate('courier')} className="mt-5 px-4 py-2 rounded-full bg-white text-black text-sm font-medium">send a courier</button>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <motion.article key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 apple-card flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="text-sm text-neutral-500">{row.picked_up ? 'picked up' : 'waiting'}</p>
                <h2 className="text-lg font-medium tracking-tight">{row.file_name}</h2>
                <p className="text-sm text-neutral-400">{row.errand || 'no errand'} · {pretty(Number(row.size) || 0)}{row.for_whom ? ` · for ${row.for_whom}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('courier', row.id)} className="px-3 py-2 rounded-full bg-white text-black text-sm">open</button>
                <button onClick={() => toggle(row)} className="px-3 py-2 rounded-full glass text-sm" disabled={busy === row.id}>{row.picked_up ? 'send back out' : 'mark picked up'}</button>
              </div>
            </motion.article>
          ))}
          {!rows.length && !error ? <p className="text-sm text-neutral-500">nothing waiting.</p> : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
