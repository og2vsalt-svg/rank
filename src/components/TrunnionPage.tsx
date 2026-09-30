import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TrunnionPage() {
  const [pieces, setPieces] = useState<{ i: number; start: number; end: number; size: number }[]>([]);
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const split = (file: File) => {
    setErr(''); setEmbed('');
    setMeta({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 50 * 1024 * 1024 ? 'big barrel. slicing stays local. publishing only the map.' : '');
    const chunk = Math.max(256 * 1024, Math.ceil(file.size / 12));
    const next = [];
    let i = 0;
    for (let start = 0; start < file.size; start += chunk) {
      const end = Math.min(file.size, start + chunk);
      next.push({ i: i++, start, end, size: end - start });
    }
    setPieces(next);
  };

  const publishMap = async () => {
    if (!meta) return;
    setBusy(true);
    try {
      const text = JSON.stringify({ name: meta.name, size: meta.size, type: meta.type, pieces }, null, 2);
      const file = new File([text], `${meta.name}.trunnion.json`, { type: 'application/json' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({ id, name: file.name, type: file.type, size: file.size, dataUrl, author: 'trunnion' });
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
          <p className="text-[#0a84ff] text-sm mb-2">trunnion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">map a file into slices. ship only the map.</h1>
          <p className="text-neutral-400 text-sm mb-6">the barrel stays on this machine. the public drop is a json of offsets.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) split(f); }}>
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && split(e.target.files[0])} />
            <p className="text-white font-medium">drop a local file</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta.name} · {pretty(meta.size)} · {pieces.length} slices</p>}
          {pieces.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-neutral-400 max-h-48 overflow-auto">
              {pieces.map((p) => (<li key={p.i}>slice {p.i + 1} · {pretty(p.size)} · {p.start}–{p.end}</li>))}
            </ul>
          )}
          {pieces.length > 0 && (
            <button disabled={busy} onClick={publishMap} className="mt-5 px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'sending map…' : 'publish slice map'}</button>
          )}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
