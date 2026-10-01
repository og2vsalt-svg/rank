import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return 'env-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function EnvelopePage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    const text = [`to: ${to || 'whoever'}`, `subject: ${subject || 'untitled'}`, '', body.trim()].join('\n');
    if (!body.trim()) {
      setErr('write something before you seal it.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
      const id = uid();
      const name = (subject || 'envelope').replace(/[^\w.-]+/g, '-').slice(0, 48) + '.txt';
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: text.length,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not seal the envelope');
        return;
      }
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">envelope</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">seal a letter as a public .txt.</h1>
          <p className="text-neutral-400 text-sm mb-6">not email. just a note with a to-line that discord can preview as a finished card.</p>
          <div className="space-y-3 mb-5">
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="to" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="subject" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the letter…" className="w-full min-h-40 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm outline-none focus:border-[#0a84ff]/50" />
          </div>
          <button onClick={send} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sealing…' : 'seal and publish'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
