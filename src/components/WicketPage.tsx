import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Wicket = {
  id: string;
  caller: string | null;
  note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
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

const ease = [0.22, 1, 0.36, 1] as const;

export default function WicketPage() {
  const { shareId, navigate } = useRouter();
  const [caller, setCaller] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Wicket | null>(null);
  const [recent, setRecent] = useState<Wicket[]>([]);

  useEffect(() => {
    fetch('/api/wicket')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.wickets) ? data.wickets : []))
      .catch(() => {});
  }, [shareId]);

  useEffect(() => {
    if (!shareId) { setOpen(null); return; }
    fetch(`/api/wicket?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing wicket');
        setOpen(data);
        setWarn(data.warn || '');
        setErr('');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that wicket'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setErr('choose a local file'); return; }
    setBusy(true);
    setErr('');
    setWarn(file.size > 8 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends. it will not be refused.' : '');
    try {
      const dataUrl = await readFile(file);
      const r = await fetch('/api/wicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller, note, name: file.name, type: file.type, dataUrl, accent: '#0A84FF' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the wicket did not open');
      setLink(data.link || '');
      setWarn(data.warn || '');
      navigate('wicket', data.id);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'wicket failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">wicket</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Pass a file through.</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.5 }} className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">One local file, a short note, a link. The bytes go to storage and the row lands in wickets. Paste /wicket/id in Discord for the card. Large drops are warned, never refused.</motion.p>
        {open ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-[#8e8e93]">{open.caller || 'someone'} passed this through</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.file_name}</h2>
            {open.note ? <p className="mt-3 text-[#d1d1d6]">{open.note}</p> : null}
            <p className="mt-3 text-sm text-[#8e8e93]">{open.pretty || `${open.size} bytes`}</p>
            {warn ? <p className="mt-2 text-sm text-[#ffd60a]">{warn}</p> : null}
            {open.file_url && !open.file_url.startsWith('data:') ? (
              <a href={open.file_url} className="mt-5 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium active:scale-[0.98] transition" download={open.file_name}>download</a>
            ) : null}
            <button onClick={() => navigate('wicket')} className="mt-4 ml-3 text-sm text-[#8e8e93] hover:text-white">leave another</button>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
            <input value={caller} onChange={(e) => setCaller(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="what should the other person know" className="w-full min-h-24 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-[#a1a1aa] cursor-pointer hover:border-[#0a84ff]/50 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file'}
            </label>
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            {link ? <p className="text-sm text-[#64d2ff] break-all">{link}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Passing it…' : 'Pass through'}</button>
          </motion.form>
        )}
        <ul className="mt-10 space-y-2">
          {recent.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.35, ease }}>
              <a href={`/wicket/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition">
                <span className="text-white">{row.file_name}</span>
                <span className="block text-sm text-[#8e8e93]">{row.caller || 'someone'}{row.note ? ` · ${row.note}` : ''}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
