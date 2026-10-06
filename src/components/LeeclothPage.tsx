import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Row = { id: string; name: string; mime?: string; size?: number; note?: string; author?: string; file_url?: string };

export default function LeeclothPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const slow = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  async function load() {
    const res = await fetch('/api/leecloth');
    if (!res.ok) return;
    const data = await res.json();
    setRows(Array.isArray(data.rows) ? data.rows : []);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!shareId) return;
    fetch('/api/leecloth?id=' + encodeURIComponent(shareId))
      .then((r) => r.json())
      .then((data) => setOpen(data.row || null))
      .catch(() => setOpen(null));
  }, [shareId]);

  async function drop() {
    if (!file) return;
    setBusy(true); setErr(''); setWarn(slow ? 'large drop. the tab may feel slow. it is not refused.' : '');
    try {
      let fileUrl = '';
      let bytes_b64 = '';
      if (file.size <= 700 * 1024) {
        bytes_b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
          reader.onerror = () => reject(new Error('could not read the file'));
          reader.readAsDataURL(file);
        });
      } else {
        const published = await publishLocalFile(file, { caption: note, author: who });
        if (!published.ok || !published.url) throw new Error(published.error || 'share table did not take the bytes');
        fileUrl = published.url;
      }
      const res = await fetch('/api/leecloth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'leecloth', name: file.name, mime: file.type, size: file.size, note, author: who, file_url: fileUrl, bytes_b64 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'database did not take the file');
      setLink(data.url || (location.origin + '/leecloth/' + data.row.id));
      setWarn(data.warn || (slow ? 'large drop. warned, not refused.' : ''));
      setFile(null); setNote('');
      navigate('leecloth', data.row.id);
      load();
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">leecloth</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A cloth over the rail, not another drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">Pick a file on this machine. Smaller ones sit on the leechoth row in Postgres. Larger ones go through the share table, then the row keeps the link. Nothing is refused for size.</p>
        <div className="apple-card mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-sm text-neutral-300">local file
            <input className="mt-2 block w-full text-sm" type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); setErr(''); }} />
          </label>
          {file && <p className="mt-2 text-sm text-neutral-400">{file.name} · {prettySize(file.size)}</p>}
          {slow && <p className="mt-2 text-sm text-amber-200/90">This one is large. The write may feel slow. It will not be blocked.</p>}
          <input className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="note, optional" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" placeholder="your name, optional" value={who} onChange={(e) => setWho(e.target.value)} />
          <button className="mt-4 rounded-full bg-[#f5f5f7] px-5 py-2.5 text-sm font-medium text-black transition duration-500 hover:-translate-y-0.5 disabled:opacity-40" disabled={!file || busy} onClick={drop}>{busy ? 'writing…' : 'keep in the database'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-2 text-sm text-amber-100/80">{warn}</p>}
          {link && <p className="mt-3 break-all text-sm text-neutral-300">Discord card: {link}</p>}
        </div>
        {open && (
          <div className="apple-card mt-6 rounded-3xl border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">open cloth</p>
            <h2 className="mt-1 text-2xl tracking-tight">{open.name}</h2>
            <p className="mt-1 text-sm text-neutral-400">{prettySize(Number(open.size) || 0)}{open.author ? ' · ' + open.author : ''}</p>
            {open.note && <p className="mt-3 text-neutral-200">{open.note}</p>}
            {open.file_url && <a className="mt-4 inline-block text-sm text-sky-300" href={open.file_url}>download</a>}
          </div>
        )}
        <ul className="mt-8 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button className="apple-card flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-left" onClick={() => navigate('leecloth', row.id)}>
                <span>{row.name}</span>
                <span className="text-xs text-neutral-500">{prettySize(Number(row.size) || 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
