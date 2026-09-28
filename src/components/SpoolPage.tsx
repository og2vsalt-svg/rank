import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Piece = { name: string; type: string; size: number; text: string };

export default function SpoolPage() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setErr('');
    const next: Piece[] = [];
    for (const file of Array.from(list)) {
      const text = await file.text();
      next.push({ name: file.name, type: file.type || 'text/plain', size: file.size, text });
    }
    setPieces((prev) => [...prev, ...next]);
    const total = [...pieces, ...next].reduce((s, p) => s + p.size, 0);
    setWarn(total > 8 * 1024 * 1024 ? 'large spool. the tab may feel slow. no hard cap.' : '');
  };

  const wound = pieces
    .map((p) => `----- ${p.name} (${pretty(p.size)}) -----\n${p.text}`)
    .join('\n\n');

  const ship = async () => {
    if (!wound) {
      setErr('nothing on the spool.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([wound], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(wound)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: `spool-${id}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'spool',
      });
      if (!res.ok) throw new Error(res.error || 'spool failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      setWarn(res.warn || '');
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not ship');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">spool</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wind several locals into one thread.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. stitch notes and dumps locally, then publish a single .txt drop with a discord /s card.
          </p>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">drop files onto the reel</span>
          </label>
          {pieces.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {pieces.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-neutral-400">
                  <span className="truncate pr-3">{p.name}</span>
                  <span className="text-xs text-neutral-500">{pretty(p.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => setPieces([])} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">clear</button>
            <button onClick={ship} disabled={busy} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'winding…' : 'publish spool'}
            </button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
