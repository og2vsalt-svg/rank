import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function ThreshPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [kb, setKb] = useState(256);
  const [mode, setMode] = useState<'over' | 'under'>('over');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const cut = kb * 1024;
  const keep = files.filter((f) => (mode === 'over' ? f.size >= cut : f.size <= cut));

  const ship = async () => {
    if (!keep.length) return;
    setErr('');
    setLinks([]);
    const heavy = keep.reduce((n, f) => n + f.size, 0);
    setWarn(heavy > 40 * 1024 * 1024 ? 'large pile. encoding can feel sleepy. no hard cap.' : '');
    setBusy(true);
    const out: string[] = [];
    try {
      for (const file of keep) {
        const dataUrl = await readAsDataUrl(file);
        const id = `thresh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: 'thresh',
        });
        if (!res.ok) throw new Error(res.error || 'share failed');
        if (res.warn) setWarn(res.warn);
        out.push(shareUrls(id).embed);
      }
      setLinks(out);
      try { await navigator.clipboard.writeText(out[0]); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'thresh failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <p className="text-[#0a84ff] text-sm mb-2">thresh</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">beat a pile, keep what crosses the line.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. sort locally by size, then ship only the keepers to the share db. discord unfurls /s.</p>
          <label className="block glass rounded-3xl p-8 text-center cursor-pointer mb-5 hover:bg-white/[0.04] transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files || [])); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <p className="text-white">{files.length ? files.length + ' files on the floor' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-1">no hard limit. we only warn when it might feel slow.</p>
          </label>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('over')} className={`flex-1 rounded-full py-2 text-sm ${mode === 'over' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>keep over</button>
            <button onClick={() => setMode('under')} className={`flex-1 rounded-full py-2 text-sm ${mode === 'under' ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>keep under</button>
          </div>
          <label className="block text-xs text-neutral-500 mb-2">threshold · {kb} kb</label>
          <input type="range" min={16} max={8192} value={kb} onChange={(e) => setKb(Number(e.target.value))} className="w-full mb-5" />
          {!!files.length && (
            <ul className="mb-5 space-y-1.5">
              {files.map((f) => {
                const on = mode === 'over' ? f.size >= cut : f.size <= cut;
                return (
                  <li key={f.name + f.size} className={`text-xs flex justify-between ${on ? 'text-white' : 'text-neutral-600'}`}>
                    <span className="truncate pr-3">{f.name}</span>
                    <span>{pretty(f.size)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <button onClick={ship} disabled={!keep.length || busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition-colors">
            {busy ? 'threshing…' : `ship ${keep.length} keeper${keep.length === 1 ? '' : 's'}`}
          </button>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {links.map((l) => <p key={l} className="text-[#0a84ff] text-xs mt-3 break-all">{l}</p>)}
        </motion.div>
      </main>
    </div>
  );
}
