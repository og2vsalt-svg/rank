import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Sheet = {
  id: string;
  to_name: string;
  eta: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  author: string | null;
  created_at: string;
  warn?: string | null;
};

export default function EndpaperPage() {
  const { shareId, navigate } = useRouter();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [focus, setFocus] = useState<Sheet | null>(null);
  const [toName, setToName] = useState('');
  const [pattern, setPattern] = useState('linen');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/endpaper');
    const data = await res.json();
    setSheets(Array.isArray(data.sheets) ? data.sheets : []);
  }
  useEffect(() => { load().catch(() => setError('endpaper is quiet right now')); }, []);
  useEffect(() => {
    if (!shareId) { setFocus(null); return; }
    fetch(`/api/endpaper?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > SLOW ? 'this sheet is heavy. it may open slowly. it is still accepted.' : '');
  }

  async function closeSheet(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('choose a file on this machine'); return; }
    if (!toName.trim()) { setError('who is this sheet for?'); return; }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/endpaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toName: toName.trim(), pattern, line: line.trim(), author: author.trim(), name: file.name, type: file.type || 'application/octet-stream', dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not close the sheet');
      setLink(data.link);
      if (data.warn) setWarn(data.warn);
      setToName('');
      setLine('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not close the sheet');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-white/40 mb-3">closing sheet</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight">endpaper</motion.h1>
        <p className="mt-3 text-white/55 leading-relaxed">The patterned sheet at the back of a book, not a vault drawer. A local file is written into the courier table with a pattern and a line. Large drops are warned, never refused.</p>
        {focus ? (
          <article className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs uppercase tracking-widest text-white/40">{focus.eta || 'linen'}</p>
            <h2 className="text-2xl mt-2 font-medium">for {focus.to_name}</h2>
            <p className="text-sm text-white/40 mt-4">{focus.file_name} · {prettySize(Number(focus.size) || 0)}{focus.author ? ` · ${focus.author}` : ''}</p>
            {focus.warn ? <p className="text-amber-200/90 text-sm mt-3">{focus.warn}</p> : null}
            {focus.file_url ? <a className="inline-flex mt-5 px-4 py-2 rounded-full bg-white text-black text-sm" href={focus.file_url}>open the file</a> : null}
          </article>
        ) : null}
        <form onSubmit={closeSheet} className="glass rounded-3xl p-6 mt-8 space-y-4">
          <label className="block text-sm text-white/70">for
            <input value={toName} onChange={(e) => setToName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="ada" />
          </label>
          <label className="block text-sm text-white/70">pattern
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} className="mt-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 outline-none">
              <option value="linen">linen</option>
              <option value="marbled">marbled</option>
              <option value="plain">plain</option>
            </select>
          </label>
          <label className="block text-sm text-white/70">closing line
            <input value={line} onChange={(e) => setLine(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="left on the last sheet" />
          </label>
          <label className="block text-sm text-white/70">from
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none" placeholder="optional" />
          </label>
          <label className="block text-sm text-white/70">local file
            <input type="file" onChange={(e) => pick(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-white/70" />
          </label>
          {warn ? <p className="text-amber-200/90 text-sm">{warn}</p> : null}
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {link ? <p className="text-sm text-white/70 break-all">share this: {link}</p> : null}
          <button disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'closing…' : 'close the sheet'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <button onClick={() => navigate('endpaper', sheet.id)} className="w-full text-left glass apple-card rounded-2xl px-4 py-3">
                <span className="block font-medium">{sheet.to_name}</span>
                <span className="block text-sm text-white/45">{sheet.file_name} · {prettySize(Number(sheet.size) || 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
