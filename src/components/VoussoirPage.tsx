import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function VoussoirPage() {
  const [rows, setRows] = useState<{ name: string; size: number; type: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...list].map((f) => ({ name: f.name, size: f.size, type: f.type || 'file' }));
    setRows(next);
    const heavy = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'some of these are chunky. we only publish the inventory, not the bytes.' : '');
  };

  const publish = async () => {
    if (!rows.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = rows.map((r, i) => `${i + 1}. ${r.name}\t${pretty(r.size)}\t${r.type}`).join('\n');
      const text = `voussoir inventory\n${new Date().toISOString()}\n\n${body}\n`;
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const pub = await publishShare({
        id: uid(),
        name: 'voussoir.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(pub.id || '');
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">voussoir</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">list a pile. ship only the stone list.</h1>
          <p className="text-neutral-400 text-sm mb-6">names, sizes, types. the actual files stay on the device. discord gets a /s card for the inventory.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop a handful</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. we never upload the originals from this desk.</p>
          </label>
          {rows.length > 0 && (
            <ul className="text-sm text-neutral-300 space-y-1 mb-5">
              {rows.map((r) => (
                <li key={r.name + r.size} className="truncate">{r.name} \u00b7 {pretty(r.size)}</li>
              ))}
            </ul>
          )}
          <button onClick={publish} disabled={busy || !rows.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing\u2026' : 'publish inventory'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">discord card: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
