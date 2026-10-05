import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

type Row = { id: string; title: string; body: string; when_label?: string | null; share_id?: string | null; created_at?: string };

export default function QuarterPage() {
  const { navigate, shareId } = useRouter();
  const [title, setTitle] = useState('evening sitting');
  const [whenLabel, setWhenLabel] = useState('after the light drops');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch('/api/quarter?list=1')
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d.quarters) ? d.quarters : []))
      .catch(() => setRows([]));
  }, []);

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setWarn(f && f.size > 24 * 1024 * 1024 ? 'a heavy sitting. the send may feel slow. nothing is refused for size.' : '');
  };

  const fileIt = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setErr('');
    try {
      let shareIdLocal: string | null = null;
      if (file) {
        const shared = await publishLocalFile(file, { author: 'quarter', caption: body.slice(0, 180), cardTitle: title.trim() });
        if (!shared.ok || !shared.id) throw new Error(shared.error || 'the file did not land in the share table');
        shareIdLocal = shared.id;
        if (shared.warn) setWarn(shared.warn);
      }
      const res = await fetch('/api/quarter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, whenLabel, shareId: shareIdLocal, author: 'quarter' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'the desk did not take the note');
      const card = `${location.origin}/quarter/${data.quarter.id}`;
      setLink(card);
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('quarter', data.quarter.id);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">quarter</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a desk for the sitting, not another drawer.</h1>
          <p className="text-neutral-400 text-sm mb-6">write what you are reading or keeping. a local file is optional and lands in the same share table as the older desks. discord unfurls /quarter. no size gate — only a slowness note.</p>
          {shareId && <p className="text-xs text-neutral-500 mb-4">open card · {shareId}</p>}
          <label className="block text-xs text-neutral-500 mb-1">title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block text-xs text-neutral-500 mb-1">when</label>
          <input value={whenLabel} onChange={(e) => setWhenLabel(e.target.value)} className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block text-xs text-neutral-500 mb-1">the sitting</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="what you are actually looking at" className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition-colors" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-4 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={fileIt} disabled={busy || !title.trim() || !body.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform duration-150">
            {busy ? 'setting the desk…' : 'leave it on the desk'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
        {rows.length > 0 && (
          <div className="mt-6 space-y-2">
            {rows.slice(0, 6).map((row, i) => (
              <motion.button key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onClick={() => navigate('quarter', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition-colors">
                <p className="text-sm text-white">{row.title}</p>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{row.when_label ? `${row.when_label} · ` : ''}{row.body}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
