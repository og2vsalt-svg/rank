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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function FlukePage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f && f.size > 12 * 1024 * 1024 ? 'heavy fluke. the tab may lag while it embeds. no hard cap.' : '');
  };

  const drop = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const hrs = Number(hours);
      const expiresAt = Number.isFinite(hrs) && hrs > 0 ? new Date(Date.now() + hrs * 3600_000).toISOString() : null;
      const named = note.trim() ? `${file.name} — ${note.trim().slice(0, 80)}` : file.name;
      const res = await publishShare({
        id,
        name: named,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
        author: 'fluke',
      });
      if (!res.ok) throw new Error(res.error || 'fluke missed');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">fluke</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hook a local file and let it drift.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads into the public shares table. discord unfurls the /s card. fade time is optional. no size cap — only a slowness warning.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'drop or choose a file'}</span>
          </label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional caption on the hook" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <div className="flex gap-2 mb-5">
            {['6', '24', '72', '0'].map((h) => (
              <button key={h} onClick={() => setHours(h)} className={`px-3.5 py-1.5 rounded-full text-sm transition-colors ${hours === h ? 'bg-white text-black' : 'glass text-neutral-300'}`}>
                {h === '0' ? 'no fade' : h + 'h'}
              </button>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={drop} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'setting the hook…' : 'publish drop'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
