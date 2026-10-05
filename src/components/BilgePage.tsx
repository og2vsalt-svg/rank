import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Row = { id: string; title: string; body: string; when_label?: string | null; created_at?: string };

export default function BilgePage() {
  const { navigate } = useRouter();
  const [line, setLine] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = () => {
    fetch('/api/quarter?list=1&page=bilge')
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d.quarters) ? d.quarters : []))
      .catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  const clock = useMemo(() => now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), [now]);

  const leave = async () => {
    if (!line.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/quarter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: line.trim().slice(0, 80),
          body: line.trim(),
          whenLabel: clock,
          author: 'bilge',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'the watch did not take the line');
      const card = `${location.origin}/bilge/${data.quarter.id}`;
      try { await navigator.clipboard.writeText(card); } catch {}
      setLine('');
      navigate('bilge', data.quarter.id);
      load();
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">bilge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a watch, not a vault.</h1>
          <p className="text-5xl font-semibold tracking-tight tabular-nums mb-4">{clock}</p>
          <p className="text-neutral-400 text-sm mb-6">leave one line about what you are keeping an eye on. it is stored beside the desk notes, not as a file drawer. paste /bilge in discord for the card.</p>
          <textarea value={line} onChange={(e) => setLine(e.target.value)} rows={3} placeholder="the thing you do not want to forget" className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={leave} disabled={busy || !line.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform duration-150">
            {busy ? 'marking the watch…' : 'mark the watch'}
          </button>
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.filter((row) => row.title).slice(0, 8).map((row, i) => (
            <motion.button key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.4 }} onClick={() => navigate('bilge', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition-colors">
              <p className="text-sm text-white">{row.title}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.when_label || 'watch'}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
