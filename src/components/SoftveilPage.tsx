import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type Share = {
  id: string;
  name: string;
  caption: string | null;
  size: number;
  file_url?: string;
  author: string | null;
  created_at: string;
  warn?: string | null;
  mime?: string;
  meta?: { accent?: string };
};

export default function SoftveilPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#a78bfa');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  async function load() {
    const res = await fetch('/api/softveil');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('softveil is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/softveil?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError('choose one or more files on this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('could not read the file'));
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/softveil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            title: title || file.name,
            caption,
            author,
            accent,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'could not share');
        if (data.warn) setWarn(data.warn);
        const path = data.sharePath || `/softveil/${data.id}`;
        newLinks.push(window.location.origin + path);
      }
      setLinks(newLinks);
      if (newLinks.length === 1) navigate('softveil', newLinks[0].split('/').pop());
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not share');
    } finally {
      setBusy(false);
    }
  }

  const accentStyle = focus?.meta?.accent ? { borderColor: focus.meta.accent, boxShadow: `0 0 40px ${focus.meta.accent}22` } : {};

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#a78bfa] mb-3">soft veil</p>
          <h1 className="text-4xl font-semibold tracking-tight">softveil</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Drop one or many local files under a soft veil of light. Each settles into its own frosted glass card with spring motion and a chosen accent. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 border"
              style={accentStyle}
            >
              <h2 className="text-2xl font-medium">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3">{focus.warn}</p>}
              {focus.file_url && (
                <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={share} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional, defaults to filename"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#a78bfa]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the veil"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#a78bfa]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#a78bfa]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-10 rounded-full border border-white/15 bg-transparent cursor-pointer"
                  />
                  <span className="text-neutral-400 text-sm">{accent}</span>
                </div>
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(', ') : 'choose one or more files on this machine'}
              </label>
              {files.some(f => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large file(s). they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {links.length > 0 && (
                <div className="space-y-1">
                  {links.map((l) => <p key={l} className="text-sm text-[#a78bfa] break-all">{l}</p>)}
                </div>
              )}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">
                {busy ? 'veiling…' : 'drop under the veil'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-3">
              <AnimatePresence>
                {shares.map((row, i) => (
                  <motion.li
                    key={row.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.04 }}
                  >
                    <button
                      onClick={() => navigate('softveil', row.id)}
                      className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform border"
                      style={row.meta?.accent ? { borderColor: row.meta.accent + '44' } : undefined}
                    >
                      <span className="text-white">{row.name}</span>
                      {row.caption && <span className="text-neutral-500 text-sm"> · {row.caption.slice(0, 40)}</span>}
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
