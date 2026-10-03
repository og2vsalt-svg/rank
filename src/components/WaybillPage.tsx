import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WaybillPage() {
  const [destination, setDestination] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const heavy = useMemo(() => !!file && file.size > 40 * 1024 * 1024, [file]);

  const send = async () => {
    if (!destination.trim()) {
      setError('a destination keeps the slip honest');
      return;
    }
    setBusy(true);
    setError('');
    setEmbed('');
    let shareId = '';
    let fileUrl = '';
    let fileName = '';
    if (file) {
      const filed = await publishLocalFile(file, {
        caption: note.trim() || destination.trim(),
        cardTitle: destination.trim(),
        color: '#0A84FF',
      });
      if (!filed.ok) {
        setBusy(false);
        setError(filed.error || 'the file did not land');
        return;
      }
      shareId = filed.id || '';
      fileUrl = filed.url || '';
      fileName = file.name;
      setWarn(filed.warn || null);
      if (filed.embed) setEmbed(filed.embed);
    }
    const res = await fetch('/api/waybill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: destination.trim(),
        note: note.trim(),
        shareId,
        fileName,
        fileUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'waybill table did not take the row');
      return;
    }
    if (!embed) setEmbed(`${location.origin}/waybill`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">waybill</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Hand it to someone.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">A destination, a short note, and an optional local file. The file lands in the share database. The slip lands in its own table. Discord unfurls /waybill and the /s card. Large files are warned, never refused.</p>
        <motion.form onSubmit={(e) => { e.preventDefault(); send(); }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="who or where this is for" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/70" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line they should read first" rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/70" />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center transition hover:border-[#0A84FF]/60">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-zinc-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}</span>
          </label>
          {heavy && <p className="text-xs text-amber-200/90">large drop. the tab may feel slow while it sends. there is no size cap.</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40">{busy ? 'filing…' : 'file the waybill'}</button>
          {embed && <a className="block text-sm text-[#0A84FF]" href={embed}>{embed}</a>}
        </motion.form>
      </main>
    </div>
  );
}
