import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function RivuletPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    setLines((prev) => [...prev, `${new Date().toISOString()}  ${t}`]);
    setDraft('');
  };

  const ship = async () => {
    if (!lines.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = lines.join('\n') + '\n';
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: 'rivulet.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'publish missed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'rivulet failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">rivulet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a thin stream of notes.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. stack lines locally, then pour them into one public .txt with a discord /s card.
          </p>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
              placeholder="add a line"
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={add} className="text-[13px] px-4 py-2 rounded-full bg-white/10 text-white">add</button>
          </div>
          <div className="mt-5 min-h-[120px] rounded-2xl bg-black/30 border border-white/5 px-4 py-3 font-mono text-[12px] text-neutral-300 whitespace-pre-wrap">
            {lines.length ? lines.join('\n') : 'empty stream'}
          </div>
          <button
            onClick={ship}
            disabled={busy || !lines.length}
            className="mt-4 text-[13px] font-medium px-4 py-2 rounded-full bg-white text-black disabled:opacity-40"
          >
            {busy ? 'shipping…' : 'publish stream'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-3 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
