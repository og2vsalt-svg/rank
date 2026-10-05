import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function BeaconPage() {
  const { navigate } = useRouter();
  const [signal, setSignal] = useState('');
  const [fadeAt, setFadeAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const light = async () => {
    if (!signal.trim()) return;
    setBusy(true);
    setErr('');
    try {
      let shareId: string | null = null;
      if (file) {
        const shared = await publishLocalFile(file, { author: 'beacon', caption: signal, cardTitle: signal.slice(0, 80) });
        if (!shared.ok || !shared.id) throw new Error(shared.error || 'the file did not land');
        shareId = shared.id;
        if (shared.warn) setWarn(shared.warn);
      }
      const res = await fetch('/api/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal, fadeAt: fadeAt ? new Date(fadeAt).toISOString() : null, shareId, author: 'beacon' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'beacon table did not light');
      const card = `${location.origin}/beacon/${data.beacon.id}`;
      setLink(card);
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('beacon', data.beacon.id);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#ffd60a] text-sm mb-2">beacon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">light a signal. the fade is a note, not a lock.</h1>
          <p className="text-neutral-400 text-sm mb-6">the line lives in the beacon table. an optional local file still lands in the share database. discord unfurls /beacon and /s. no size gate.</p>
          <textarea value={signal} onChange={(e) => setSignal(e.target.value)} rows={3} placeholder="the door is on the latch" className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#ffd60a]/50 transition-colors" />
          <label className="block text-xs text-neutral-500 mb-1">fade after (optional)</label>
          <input type="datetime-local" value={fadeAt} onChange={(e) => setFadeAt(e.target.value)} className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#ffd60a]/40 p-8 text-center mb-4 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setWarn(f && f.size > 24 * 1024 * 1024 ? 'a heavy lantern. the send may feel slow. nothing is refused for size.' : ''); }} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={light} disabled={busy || !signal.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'lighting…' : 'light it'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
