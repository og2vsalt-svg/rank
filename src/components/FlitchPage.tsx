import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function FlitchPage() {
  const [parts, setParts] = useState<{ name: string; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const next: { name: string; text: string }[] = [];
    let total = 0;
    for (const f of Array.from(list)) {
      total += f.size;
      const text = await f.text().catch(() => '');
      next.push({ name: f.name, text });
    }
    setParts((p) => [...p, ...next]);
    setWarn(total > 8 * 1024 * 1024 ? 'this stack is chunky. no cap, it just might feel slow.' : '');
  };

  const send = async () => {
    if (!parts.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = parts.map((p) => `===== ${p.name} =====\n${p.text}\n`).join('\n');
      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not stack'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'flitch.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'flitch split');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'flitch split');
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
          <p className="text-[#0a84ff] text-sm mb-2">flitch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack text files into one public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. a single slab that hits the share db. discord card copies itself.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-4">
            <input type="file" multiple accept=".txt,.md,.json,.csv,.log" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop notes to stack</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {parts.length > 0 && (
            <ul className="text-xs text-neutral-400 space-y-1 mb-4">
              {parts.map((p, i) => (
                <li key={i}>{p.name} · {p.text.length} chars</li>
              ))}
            </ul>
          )}
          <button onClick={send} disabled={busy || !parts.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'stacking…' : 'publish stack'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 break-all mt-4">copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
