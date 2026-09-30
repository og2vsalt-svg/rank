import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LychgatePage() {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    const body = note.trim();
    if (!body) { setErr('write something first'); return; }
    setErr('');
    setBusy(true);
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: 'lychgate.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'lychgate',
      });
      if (!res.ok) throw new Error(res.error || 'gate stuck');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'gate stuck');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lychgate</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a note that walks out.</h1>
          <p className="text-neutral-400 text-sm mb-6">this is not a vault grid. it is a quiet door. the note becomes a public .txt drop with a discord card.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={8}
            placeholder="leave a line at the gate…"
            className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition"
          />
          <button
            onClick={() => void send()}
            disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {busy ? 'opening…' : 'walk it out'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied · {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
