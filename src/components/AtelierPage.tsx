import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Row = { id: string; name: string; mime?: string; size: number; note?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export default function AtelierPage() {
  const { shareId, navigate } = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [focus, setFocus] = useState<Row | null>(null);

  const load = async () => {
    const r = await fetch('/api/atelier');
    const data = await r.json();
    setRows(Array.isArray(data.rows) ? data.rows : []);
  };

  useEffect(() => { load().catch(() => setErr('the desk could not reach the database.')); }, []);

  useEffect(() => {
    if (!shareId) { setFocus(null); return; }
    fetch('/api/atelier?id=' + encodeURIComponent(shareId)).then((r) => r.json()).then((data) => setFocus(data.row || null)).catch(() => setFocus(null));
  }, [shareId]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setLink('');
    setWarn(file.size > 2.5 * 1024 * 1024 ? pretty(file.size) + ' will feel slow. nothing is refused — the database just takes longer to write.' : '');
    setBusy(true);
    try {
      const data = await fileToBase64(file);
      const r = await fetch('/api/atelier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, mime: file.type || 'application/octet-stream', note, author, data }) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'upload failed');
      setLink(body.url);
      await load();
      navigate('atelier', body.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-white/45">atelier</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">A quiet desk for a local file.</motion.h1>
        <p className="mt-3 max-w-xl text-white/60">Bytes land in the database, not a drawer of the vault. Paste the link in Discord and the card follows. Large files are warned, never refused.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 22 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the card" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]" />
          </div>
          <button onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }} className="mt-4 flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-black/20 px-6 py-12 transition hover:border-[#0A84FF]/70 hover:bg-white/[0.03]">
            <span className="text-lg font-medium">{busy ? 'writing to the database…' : 'drop a file, or choose one'}</span>
            <span className="mt-1 text-sm text-white/45">no size cap. over a couple of megabytes, expect a pause.</span>
          </button>
          <input ref={input} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <code className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/80">{link}</code>
              <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#0A84FF] px-4 py-1.5 text-sm font-medium text-white transition active:scale-95">{copied ? 'copied' : 'copy link'}</button>
            </div>
          )}
        </motion.div>
        {focus && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">open drop</p>
            <h2 className="mt-1 text-2xl font-semibold">{focus.name}</h2>
            <p className="mt-1 text-sm text-white/55">{pretty(Number(focus.size) || 0)} · {focus.mime || 'file'} {focus.note ? `· ${focus.note}` : ''}</p>
            <a className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black" href={'/api/atelier?id=' + encodeURIComponent(focus.id) + '&download=1'}>open file</a>
          </motion.section>
        )}
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-[0.18em] text-white/40">recent on the desk</h2>
          <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-[24px] border border-white/10">
            {rows.length === 0 && <p className="px-4 py-6 text-sm text-white/45">nothing here yet.</p>}
            {rows.map((row) => (
              <button key={row.id} onClick={() => navigate('atelier', row.id)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.04]">
                <span><span className="block font-medium">{row.name}</span><span className="text-xs text-white/45">{row.note || 'no note'}</span></span>
                <span className="text-xs text-white/50">{pretty(Number(row.size) || 0)}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
