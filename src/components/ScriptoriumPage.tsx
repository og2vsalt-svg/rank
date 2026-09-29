import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

export default function ScriptoriumPage() {
  const [text, setText] = useState('');
  const [name, setName] = useState('letter.txt');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], name.replace(/\s+/g, '-') || 'letter.txt', { type: 'text/plain' });
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(file);
      });
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: 'text/plain', size: file.size, dataUrl, author: 'scriptorium' }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e) {
      setErr(e?.message || 'scriptorium failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">scriptorium</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a letter. publish the page.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault dump — a short note that becomes a public text drop with a discord card.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" placeholder="filename" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y" placeholder="ink goes here" />
          <button onClick={send} disabled={busy || !text.trim()} className="mt-4 rounded-full bg-[#0a84ff] text-white text-sm px-5 py-2.5 disabled:opacity-40 transition hover:brightness-110">
            {busy ? 'setting type…' : 'publish letter'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
