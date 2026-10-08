import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Plinth = {
  id: string;
  title: string;
  label: string | null;
  materials: string | null;
  year_note: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  author: string | null;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function PlinthPage() {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [materials, setMaterials] = useState('');
  const [yearNote, setYearNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [rows, setRows] = useState<Plinth[]>([]);
  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'This one is large. The tab may feel slow while it sends. Nothing is refused.' : null), [file]);

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/plinths?select=*&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Give the piece a title.');
      return;
    }
    setBusy(true);
    setErr(null);
    setWarn(slow);
    setLink(null);
    try {
      let fileUrl: string | null = null;
      let mime: string | null = null;
      let size = 0;
      let fileName: string | null = null;
      if (file) {
        const published = await publishLocalFile(file, {
          caption: label.trim() || title.trim(),
          author: author.trim() || undefined,
          cardTitle: title.trim(),
          meta: { desk: 'plinth' },
        });
        if (!published.ok) throw new Error(published.error || 'upload failed');
        fileUrl = published.url || null;
        mime = file.type || 'application/octet-stream';
        size = file.size;
        fileName = file.name;
        if (published.warn) setWarn(published.warn);
      }
      const id = uid();
      const row = {
        id,
        title: title.trim(),
        label: label.trim() || null,
        materials: materials.trim() || null,
        year_note: yearNote.trim() || null,
        file_name: fileName,
        mime,
        size,
        file_url: fileUrl,
        author: author.trim() || null,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/plinths`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180) || 'could not save the label');
      const href = `${location.origin}/plinth/${id}`;
      setLink(href);
      setTitle('');
      setLabel('');
      setMaterials('');
      setYearNote('');
      setFile(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'could not set the piece');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[12px] tracking-[0.16em] uppercase text-white/40">exhibit</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">plinth</h1>
        <p className="mt-3 text-[15px] leading-6 text-white/60 max-w-xl">
          A wall label for one local file. The bytes go into the share table. The label lives beside it. This is not another drawer.
        </p>
        <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title on the wall" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="wall label, one line" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="materials" className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
            <input value={yearNote} onChange={(e) => setYearNote(e.target.value)} placeholder="year or season" className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          </div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/55 hover:border-white/30 transition cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? `${file.name} · ${pretty(file.size)}` : 'choose a local file, or leave the plinth empty'}
          </label>
          {slow && <p className="text-[13px] text-amber-200/80">{slow}</p>}
          {warn && <p className="text-[13px] text-amber-200/80">{warn}</p>}
          {err && <p className="text-[13px] text-red-300">{err}</p>}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition">{busy ? 'setting…' : 'set on the plinth'}</button>
          {link && (
            <p className="text-[13px] text-white/70 break-all">
              card link <a className="text-[#64d2ff]" href={link}>{link}</a>
            </p>
          )}
        </form>
        <section className="mt-10 space-y-3">
          {rows.map((row) => (
            <a key={row.id} href={`/plinth/${row.id}`} className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 hover:bg-white/[0.05] transition">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-medium tracking-tight">{row.title}</h2>
                <span className="text-[12px] text-white/35">{row.file_name ? pretty(Number(row.size) || 0) : 'label only'}</span>
              </div>
              {row.label && <p className="mt-1 text-[14px] text-white/55">{row.label}</p>}
              <p className="mt-2 text-[12px] text-white/35">{[row.materials, row.year_note, row.author].filter(Boolean).join(' · ') || 'untitled materials'}</p>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
