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

type Piece = {
  id: string;
  title: string;
  caption: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  author: string | null;
  created_at: string;
};

export default function QuietforgePage() {
  const { shareId, navigate } = useRouter();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [focus, setFocus] = useState<Piece[] | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/quietforge');
    const data = await res.json();
    setPieces(Array.isArray(data.pieces) ? data.pieces : []);
  }

  useEffect(() => {
    load().catch(() => setError('forge is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/quietforge?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data.pieces : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError('choose one or more files on this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const filePayloads = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('could not read the file'));
            reader.readAsDataURL(file);
          });
          return { dataUrl, name: file.name, type: file.type, size: file.size };
        })
      );
      const res = await fetch('/api/quietforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filePayloads, title, caption, author }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'forge did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/quietforge/${data.id}`;
      setLink(window.location.origin + path);
      navigate('quietforge', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'forge did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#64d2ff] mb-3">forging</p>
          <h1 className="text-4xl font-semibold tracking-tight">quietforge</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Leave one or many local files under a shared title and caption. Soft rings settle with spring motion on frosted glass. Files land in storage and the quietforge table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Not a vault drawer.</p>
          {focus ? (
            <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mt-8">
              <p className="text-sm text-neutral-500">{focus[0]?.title}</p>
              {focus[0]?.caption && <p className="text-neutral-300 mt-2">{focus[0].caption}</p>}
              <ul className="mt-4 space-y-3">
                {focus.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>{p.file_name} · {prettySize(Number(p.size) || 0)}</span>
                    {p.file_url && <a href={p.file_url} className="text-[#64d2ff]" download>take</a>}
                  </li>
                ))}
              </ul>
              {focus[0]?.author && <p className="text-sm text-neutral-500 mt-3">from {focus[0].author}</p>}
              {warn && <p className="text-amber-300/90 text-sm mt-3">{warn}</p>}
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                title
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="a quiet collection" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="optional note" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(', ') : 'choose one or more files on this machine'}
              </label>
              {files.some(f => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#64d2ff] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">{busy ? 'forging…' : 'leave it in the forge'}</button>
            </form>
          )}
          {pieces.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {pieces.slice(0, 12).map((row) => (
                <li key={row.id + row.file_name}>
                  <button onClick={() => navigate('quietforge', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                    <span className="text-white">{row.title}</span>
                    <span className="text-neutral-500 text-sm"> · {row.file_name}</span>
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
