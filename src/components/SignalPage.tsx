import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function SignalPage() {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  const probe = async () => {
    const id = raw.trim().replace(/^.*[?&#]f=/, '').replace(/^.*\/s\//, '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id) {
      setStatus('need an id');
      setDetail('');
      return;
    }
    setBusy(true);
    setStatus('listening…');
    setDetail('');
    try {
      const meta = await fetchShare(id);
      if (!meta) {
        setStatus('quiet');
        setDetail('no live public drop for that id. expired, private, or never published.');
      } else {
        setStatus('live');
        setDetail(`${meta.name} · ${meta.type} · ${meta.size} bytes\n${shareUrls(id).embed}`);
      }
    } catch (e: any) {
      setStatus('broken');
      setDetail(e?.message || 'network hiccup');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">signal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">is this drop still breathing?</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id or /s/ link. we ping the db, no extra tools.</p>
          <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="id or https://…/s/…" className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
          <button onClick={probe} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">{busy ? 'pinging…' : 'check signal'}</button>
          {status && <p className="mt-5 text-sm text-white">{status}</p>}
          {detail && <pre className="mt-2 text-xs text-neutral-400 whitespace-pre-wrap break-all">{detail}</pre>}
        </motion.div>
      </div>
    </div>
  );
}
