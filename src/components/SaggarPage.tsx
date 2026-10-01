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

export default function SaggarPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState('');

  const pick = (list: FileList | null) => {
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setLinks([]);
    setErr('');
    const heavy = next.some((f) => f.size > 16 * 1024 * 1024);
    setWarn(heavy ? 'a thick kiln load. the tab may feel slow. no hard cap.' : '');
  };

  const fire = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: string[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(file);
        });
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: 'saggar',
        });
        if (!res.ok) throw new Error(res.error || `could not fire ${file.name}`);
        out.push(shareUrls(res.id || id).embed);
      }
      setLinks(out);
      try { await navigator.clipboard.writeText(out.join('\n')); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">saggar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">several pieces, one firing.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick many local files. each one is boxed and written to the share database as its own public drop with its own discord card. not a folder vault — a kiln tray.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5">
            <input type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
            <span className="text-sm text-neutral-300">{files.length ? `${files.length} pieces` : 'load the saggar'}</span>
          </label>
          <ul className="mb-5 space-y-1">
            {files.map((f) => (
              <li key={f.name + f.size} className="text-xs text-neutral-400 truncate">{f.name} · {pretty(f.size)}</li>
            ))}
          </ul>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={fire} disabled={busy || !files.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'in the kiln…' : 'fire the tray'}
          </button>
          {links.length > 0 && (
            <div className="mt-4 space-y-1">
              {links.map((l) => <p key={l} className="text-xs text-neutral-500 break-all">{l}</p>)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
