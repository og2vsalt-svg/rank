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
  title: string;
  edition: string | null;
  imprint: string;
  maker: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  warn?: string | null;
};

export default function ColophonPage() {
  const { shareId, navigate } = useRouter();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [focus, setFocus] = useState<Sheet | null>(null);
  const [title, setTitle] = useState('');
  const [edition, setEdition] = useState('');
  const [imprint, setImprint] = useState('');
  const [maker, setMaker] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/colophon');
    const data = await res.json();
    setSheets(Array.isArray(data.sheets) ? data.sheets : []);
  }

  useEffect(() => { load().catch(() => setError('the colophon desk is quiet right now')); }, []);

  useEffect(() => {
    if (!shareId) { setFocus(null); return; }
    fetch(`/api/colophon?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > SLOW ? 'this sheet is heavy. it may open slowly. it is still accepted.' : '');
  }

  async function fileSheet(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('choose a file on this machine'); return; }
    if (!title.trim()) { setError('the colophon needs a title'); return; }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/colophon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          edition: edition.trim(),
          imprint: imprint.trim(),
          maker: maker.trim(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not file the colophon');
      setLink(data.link);
      if (data.warn) setWarn(data.warn);
      setTitle('');
      setEdition('');
      setImprint('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not file the colophon');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-white/40 mb-3">closing credits</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight">colophon</motion.h1>
        <p className="mt-3 text-white/55 leading-relaxed">Credits beside a local file: title, edition, imprint. The bytes land in storage and a row in the share table. Large drops are warned, never refused. Discord unfurls /colophon/id. Not a vault drawer.</p>
        {focus ? (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs uppercase tracking-widest text-white/40">{focus.edition || 'edition'}</p>
            <h2 className="text-2xl mt-2 font-medium">{focus.title}</h2>
            <p className="text-white/60 mt-2">{focus.imprint || 'no imprint line'}</p>
            <p className="text-sm text-white/40 mt-4">{focus.file_name} · {prettySize(Number(focus.size) || 0)}{focus.maker ? ` · ${focus.maker}` : ''}</p>
            {focus.warn ? <p className="text-amber-200/90 text-sm mt-3">{focus.warn}</p> : null}
            {focus.file_url && !String(focus.file_url).startsWith('data:') ? <a className="inline-flex mt-5 px-4 py-2 rounded-full bg-white text-black text-sm" href={focus.file_url}>open the file</a> : null}
          </motion.article>
        ) : null}
        <form onSubmit={fileSheet} className="glass rounded-3xl p-6 mt-8 space-y-4">
          <label className="block text-sm text-white/70">title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="night proofs" />
          </label>
          <label className="block text-sm text-white/70">edition
            <input value={edition} onChange={(e) => setEdition(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="second, corrected" />
          </label>
          <label className="block text-sm text-white/70">imprint
            <input value={imprint} onChange={(e) => setImprint(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="set by hand, filed here" />
          </label>
          <label className="block text-sm text-white/70">maker
            <input value={maker} onChange={(e) => setMaker(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="optional" />
          </label>
          <label className="block text-sm text-white/70">local file
            <input type="file" onChange={(e) => pick(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-white/70" />
          </label>
          {warn ? <p className="text-amber-200/90 text-sm">{warn}</p> : null}
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {link ? <p className="text-sm text-white/70 break-all">share this: {link}</p> : null}
          <button disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 transition-transform active:scale-[0.98]">{busy ? 'filing…' : 'file the colophon'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {sheets.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <button onClick={() => navigate('colophon', item.id)} className="w-full text-left glass apple-card rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                <span className="block font-medium">{item.title}</span>
                <span className="block text-sm text-white/45">{item.edition || 'edition'} · {item.file_name} · {prettySize(Number(item.size) || 0)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
