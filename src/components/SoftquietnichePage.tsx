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
  meta?: { accent?: string; color?: string };
};

export default function SoftquietnichePage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/softquietniche');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('softquietniche is resting right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/softquietniche?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function share(e: React.FormEvent) {
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
      const res = await fetch('/api/softquietniche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title: title || file.name, caption, author, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not share');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/softquietniche/${data.id}`;
      setLink(window.location.origin + path);
      navigate('softquietniche', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not share');
    } finally {
      setBusy(false);
    }
  }

  const glow = focus?.meta?.accent || focus?.meta?.color || accent || '#30D158';

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#30D158] mb-3">quiet niche</p>
          <h1 className="text-4xl font-semibold tracking-tight">softquietniche</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">A quiet niche of still light for what you carry. Drop a local file with a title, caption, and cool green accent. Soft cards settle deeper into the recess with spring motion on frosted glass, like light gathering in a still alcove. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 relative overflow-hidden"
              style={{ boxShadow: `0 0 40px ${glow}22` }}
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: glow }} />
              <h2 className="text-2xl font-medium relative">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed relative">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3 relative">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3 relative">{focus.warn}</p>}
              {focus.file_url && (
                <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition relative" download>
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
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the share"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="mt-1 w-16 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a file on this machine'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large file. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#30D158] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-[#30D158] text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition hover:bg-[#3ae06a]">
                {busy ? 'settling…' : 'share in the niche'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {shares.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softquietniche', row.id)}
                    className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform"
                  >
                    <span className="text-white">{row.name}</span>
                    {row.caption && <span className="text-neutral-500 text-sm"> · {row.caption.slice(0, 40)}</span>}
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
