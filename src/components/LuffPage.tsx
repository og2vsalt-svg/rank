import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function LuffPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [heading, setHeading] = useState('north by the window');
  const [wind, setWind] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f && f.size > 24 * 1024 * 1024 ? 'a wide sail. the send may feel slow. nothing is refused for size.' : '');
  };

  const fileIt = async () => {
    if (!file || !heading.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const shared = await publishLocalFile(file, { author: 'luff', caption: note || heading, cardTitle: heading.trim() });
      if (!shared.ok || !shared.id) throw new Error(shared.error || 'the file did not land');
      const res = await fetch('/api/luff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, wind, note, shareId: shared.id, author: 'luff' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'luff table did not take the angle');
      const card = `${location.origin}/luff/${data.luff.id}`;
      setLink(card);
      if (shared.warn) setWarn(shared.warn);
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('luff', data.luff.id);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">luff</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">set the sail angle, then hand the file across.</h1>
          <p className="text-neutral-400 text-sm mb-6">the heading lives in its own table. the local file lands in the share database. discord reads /luff and /s. no size gate — only a slowness note.</p>
          <label className="block text-xs text-neutral-500 mb-1">heading</label>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block text-xs text-neutral-500 mb-1">wind</label>
          <input value={wind} onChange={(e) => setWind(e.target.value)} placeholder="light, off the port bow" className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block text-xs text-neutral-500 mb-1">note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-4 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'choose a local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={fileIt} disabled={busy || !file || !heading.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'hauling the sheet…' : 'file the angle'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link} · file card {shareUrls('').embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
