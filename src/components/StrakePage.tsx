import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function StrakePage() {
  const [line, setLine] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const add = () => {
    const t = line.trim();
    if (!t) return;
    setLog((rows) => [...rows, `${new Date().toISOString()}  ${t}`]);
    setLine('');
  };

  const publish = async () => {
    if (!log.length) { setErr('add a line first'); return; }
    setBusy(true); setErr('');
    try {
      const file = new File([log.join('\n') + '\n'], 'strake.log', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({ id, name: file.name, type: file.type, size: file.size, dataUrl, author: 'strake' });
      if (!res.ok) throw new Error(res.error || 'failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">strake</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay down a running log, then launch it.</h1>
          <p className="text-neutral-400 text-sm mb-6">each line stays stamped. the published drop is a .log, not a vault item.</p>
          <div className="flex gap-2 mb-4">
            <input value={line} onChange={(e) => setLine(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="next plank" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
            <button onClick={add} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">add</button>
          </div>
          <ul className="mb-5 space-y-1 text-xs text-neutral-400 font-mono max-h-48 overflow-auto">
            {log.map((row, i) => (<li key={i}>{row}</li>))}
          </ul>
          <button disabled={busy} onClick={publish} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'launching…' : 'publish log'}</button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
