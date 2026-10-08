import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Stub = {
  id: string;
  label: string;
  for_whom?: string | null;
  note?: string | null;
  author?: string | null;
  file_name?: string | null;
  mime?: string | null;
  size?: number;
  file_url?: string | null;
  handed_at?: string | null;
  accent?: string;
  created_at?: string;
  pretty?: string;
  warn?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StubPage() {
  const { shareId, navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [embed, setEmbed] = useState('');
  const [open, setOpen] = useState<Stub | null>(null);
  const [board, setBoard] = useState<Stub[]>([]);
  const heavy = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  const loadBoard = () => {
    fetch('/api/stub')
      .then((r) => r.json())
      .then((data) => setBoard(Array.isArray(data.stubs) ? data.stubs : []))
      .catch(() => setBoard([]));
  };

  useEffect(() => { loadBoard(); }, []);

  useEffect(() => {
    if (!shareId) { setOpen(null); return; }
    setEmbed(`${location.origin}/stub/${shareId}`);
    fetch(`/api/stub?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setOpen(data?.id ? data : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const send = async () => {
    if (!label.trim()) {
      setError('a label keeps the stub readable');
      return;
    }
    setBusy(true);
    setError('');
    setEmbed('');
    let filedId = '';
    let fileUrl = '';
    let fileName = '';
    let mime = '';
    let size = 0;
    if (file) {
      const filed = await publishLocalFile(file, {
        caption: note.trim() || label.trim(),
        author: forWhom.trim(),
        cardTitle: label.trim(),
        color: '#30D158',
      });
      if (!filed.ok) {
        setBusy(false);
        setError(filed.error || 'the file did not land');
        return;
      }
      filedId = filed.id || '';
      fileUrl = filed.url || '';
      fileName = file.name;
      mime = file.type;
      size = file.size;
      setWarn(filed.warn || null);
    }
    const id = filedId || Math.random().toString(36).slice(2, 12);
    const res = await fetch('/api/stub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        label: label.trim(),
        forWhom: forWhom.trim(),
        note: note.trim(),
        shareId: filedId,
        fileName,
        fileUrl,
        mime,
        size,
        accent: '#30D158',
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'the stub table did not take the row');
      return;
    }
    if (data.warn) setWarn(data.warn);
    setEmbed(`${location.origin}/stub/${data.id || id}`);
    setLabel('');
    setNote('');
    setFile(null);
    loadBoard();
    navigate('stub', data.id || id);
  };

  const hand = async () => {
    if (!open?.id) return;
    const res = await fetch('/api/stub', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: open.id }),
    });
    if (res.ok) setOpen({ ...open, handed_at: new Date().toISOString() });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">stub</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Tear off a counterfoil.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">A label, who it is for, and an optional local file. The bytes go to storage and the share table. The stub itself is a row, not a cabinet. Paste /stub/id in Discord for the card. Large files are warned, never refused.</p>
        {open && (
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{open.for_whom ? `for ${open.for_whom}` : 'unaddressed'}</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{open.label}</h2>
            {open.note && <p className="mt-3 text-[15px] leading-relaxed text-white/70">{open.note}</p>}
            <p className="mt-3 text-sm text-white/45">{open.file_name ? `${open.file_name} · ${open.pretty || pretty(Number(open.size) || 0)}` : 'no file on this stub'}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {open.file_url && <a href={open.file_url} className="rounded-full bg-[#30D158] px-4 py-2 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">open the file</a>}
              <button onClick={hand} disabled={!!open.handed_at} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5 disabled:opacity-50">{open.handed_at ? 'handed over' : 'mark handed over'}</button>
            </div>
            {open.warn && <p className="mt-3 text-xs text-amber-200/80">{open.warn}</p>}
          </motion.article>
        )}
        <motion.form onSubmit={(e) => { e.preventDefault(); send(); }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what this stub is for" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30D158]/70" />
          <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="who should have the other half" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30D158]/70" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line on the counterfoil" rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30D158]/70" />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center transition hover:border-[#30D158]/60">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-zinc-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}</span>
          </label>
          {heavy && <p className="text-xs text-amber-200/90">large drop. the tab may feel slow while it sends. there is no size cap.</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40">{busy ? 'tearing…' : 'tear the stub'}</button>
          {embed && <a className="block text-sm text-[#30D158]" href={embed}>{embed}</a>}
        </motion.form>
        <section className="mt-10">
          <h2 className="text-lg font-medium text-zinc-100">recent stubs</h2>
          <ul className="mt-3 space-y-2">
            {board.map((row) => (
              <li key={row.id}>
                <button onClick={() => navigate('stub', row.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition duration-200 hover:bg-white/[0.06]">
                  <span className="text-sm font-medium text-zinc-100">{row.label}</span>
                  <span className="text-xs text-white/40">{row.handed_at ? 'handed' : row.pretty || pretty(Number(row.size) || 0)}</span>
                </button>
              </li>
            ))}
            {!board.length && <li className="text-sm text-white/40">no stubs yet.</li>}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
