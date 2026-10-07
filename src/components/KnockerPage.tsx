import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Knock = {
  id: string;
  caller: string | null;
  note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  accent?: string | null;
  created_at: string;
  pretty?: string;
  warn?: string | null;
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

export default function KnockerPage() {
  const { shareId } = useRouter();
  const [caller, setCaller] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Knock | null>(null);
  const [recent, setRecent] = useState<Knock[]>([]);

  useEffect(() => {
    fetch('/api/knocker')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.knockers) ? data.knockers : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/knocker?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing knock');
        setOpen(data);
        setWarn(data.warn || '');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that knock'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setErr('choose a local file'); return; }
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends. it will not be refused.' : '');
    try {
      const dataUrl = await readFile(file);
      const r = await fetch('/api/knocker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller, note, name: file.name, type: file.type, dataUrl, accent: '#0A84FF' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the knock did not land');
      setLink(data.link || '');
      setWarn(data.warn || '');
      history.pushState(null, '', `/knocker/${data.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'knock failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">knocker</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Leave a file at the door.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">A calling note plus one local file. The bytes go to storage, the row goes to the knockers table. Paste /knocker/id in Discord for the card. Large drops are warned, never refused.</p>
        {open ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 apple-in">
            <p className="text-sm text-[#8e8e93]">{open.caller || 'someone'} knocked</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.file_name}</h2>
            {open.note ? <p className="mt-3 text-[#d1d1d6]">{open.note}</p> : null}
            <p className="mt-3 text-sm text-[#8e8e93]">{open.pretty || `${open.size} bytes`}</p>
            {warn ? <p className="mt-2 text-sm text-[#ffd60a]">{warn}</p> : null}
            {open.file_url && !open.file_url.startsWith('data:') ? (
              <a href={open.file_url} className="mt-5 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium" download={open.file_name}>download</a>
            ) : null}
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
            <input value={caller} onChange={(e) => setCaller(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="a short calling note" className="w-full min-h-24 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-[#a1a1aa] cursor-pointer hover:border-[#0a84ff]/50 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file'}
            </label>
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            {link ? <p className="text-sm text-[#64d2ff] break-all">{link}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Leaving it…' : 'Knock'}</button>
          </form>
        )}
        <ul className="mt-10 space-y-2">
          {recent.map((row) => (
            <li key={row.id}>
              <a href={`/knocker/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition">
                <span className="text-white">{row.file_name}</span>
                <span className="block text-sm text-[#8e8e93]">{row.caller || 'someone'}{row.note ? ` · ${row.note}` : ''}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
