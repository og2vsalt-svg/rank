import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function NightwatchPage() {
  const [id, setId] = useState('');
  const [opens, setOpens] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');

  const clean = (v: string) => v.replace(/^.*(?:f=|\/s\/|\/f\/)/, '').replace(/[^a-z0-9_-]/gi, '');

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    const tick = async () => {
      const sid = clean(id);
      if (!sid) return;
      try {
        const meta = await fetchShare(sid);
        if (cancelled) return;
        if (!meta) {
          setErr('share missing or expired');
          return;
        }
        setErr('');
        setName(meta.name);
        setOpens((prev) => {
          if (prev !== null && meta.downloads !== prev) {
            setLog((rows) => [`${new Date().toLocaleTimeString()} · ${prev} → ${meta.downloads || 0}`, ...rows].slice(0, 12));
          }
          return meta.downloads || 0;
        });
      } catch {
        if (!cancelled) setErr('db unreachable');
      }
    };
    tick();
    const t = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, [on, id]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nightwatch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sit with a live open count.</h1>
          <p className="text-neutral-400 text-sm mb-6">polls the share db every few seconds. no file body is fetched. copy the embed when you want discord to see it.</p>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or /s/…" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-4" />
          <div className="flex gap-2 mb-6">
            <button onClick={() => setOn(true)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">watch</button>
            <button onClick={() => setOn(false)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">pause</button>
            {clean(id) && <button onClick={() => navigator.clipboard.writeText(shareUrls(clean(id)).embed)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">copy /s</button>}
          </div>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <p className="text-5xl font-semibold tracking-tight">{opens === null ? '—' : opens}</p>
          <p className="text-sm text-neutral-500 mt-2">{name || 'no drop loaded'}{on ? ' · live' : ''}</p>
          <ul className="mt-6 space-y-1 text-xs text-neutral-500">
            {log.map((row) => <li key={row}>{row}</li>)}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
