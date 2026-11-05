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

type Drop = {
  id: string;
  title: string | null;
  note: string | null;
  accent: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  author: string | null;
  created_at: string;
  warn?: string | null;
};

export default function LumenFoldPage() {
  const { shareId, navigate } = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [focus, setFocus] = useState<Drop | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/lumenfold');
    const data = await res.json();
    setDrops(Array.isArray(data.drops) ? data.drops : []);
  }

  useEffect(() => {
    load().catch(() => setError('fold is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/lumenfold?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a file on this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/lumenfold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title, note, author, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'fold did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/lumenfold/${data.id}`;
      setLink(window.location.origin + path);
      navigate('lumenfold', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'fold did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF9500] mb-3">fold</p>
          <h1 className="text-4xl font-semibold tracking-tight">lumen fold</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Fold a local file into luminous light. Title, a longer note, accent color. Soft glass folds and settles with spring motion on deep navy. Lands in storage and the fold table. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain intact.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, rotateX: 8 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="glass rounded-[28px] p-6 mt-8"
              style={{ boxShadow: `0 12px 40px ${focus.accent || '#FF9500'}18` }}
            >
              <p className="text-sm text-neutral-500">{focus.title || 'untitled fold'}</p>
              <h2 className="text-2xl font-medium mt-1">{focus.file_name}</h2>
              {focus.note && <p className="text-neutral-300 mt-3 whitespace-pre-wrap">{focus.note}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3">{focus.warn}</p>}
              {focus.file_url && (
                <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                title
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="a quiet fold" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF9500]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                note
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what folds with it" rows={3} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF9500]/60 transition resize-none" />
              </label>
              <div className="flex gap-3">
                <label className="block text-sm text-neutral-300 flex-1">
                  from
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF9500]/60 transition" />
                </label>
                <label className="block text-sm text-neutral-300">
                  accent
                  <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-1 w-16 h-12 rounded-2xl border border-white/10 bg-transparent cursor-pointer" />
                </label>
              </div>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a file on this machine'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#FF9500] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">
                {busy ? 'folding…' : 'fold it into the light'}
              </button>
            </form>
          )}
          {drops.length > 0 && (
            <ul className="mt-8 space-y-2">
              {drops.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('lumenfold', row.id)}
                    className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform"
                    style={{ borderLeft: `3px solid ${row.accent || '#FF9500'}` }}
                  >
                    <span className="text-white">{row.title || row.file_name}</span>
                    <span className="text-neutral-500 text-sm"> · {prettySize(Number(row.size) || 0)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
