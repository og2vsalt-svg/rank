import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function LoggiaPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string }[]>([]);

  const send = async (list) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'walkway is heavy. no cap, just may feel slow.' : '');
    setBusy(true);
    setErr('');
    const next: { name: string; embed: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await readAsDataUrl(file);
        const r = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl, author: 'loggia' }),
        });
        const json = await r.json();
        if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
        next.push({ name: file.name, embed: shareUrls(json.id).embed });
      }
      setRows(next);
      if (next[0]) try { await navigator.clipboard.writeText(next.map((x) => x.embed).join('\n')); } catch {}
    } catch (e) {
      setErr(e?.message || 'loggia failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">loggia</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a colonnade of files.</h1>
          <p className="text-neutral-400 text-sm mb-6">several locals walk out as separate public drops. each gets its own discord card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'pacing the walk…' : 'drop several files'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited count. we only warn when the browser might wheeze.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((row) => (
                <li key={row.embed} className="text-xs text-neutral-400 break-all">{row.name} — {row.embed}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
