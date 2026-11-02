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
  mime: string | null;
  created_at: string;
  meta?: { accent?: string };
};

export default function GlowPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/glow');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('glow is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/glow?id=${encodeURIComponent(shareId)}`)
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
      const res = await fetch('/api/glow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title, caption, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'glow did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/glow/${data.id}`;
      setLink(window.location.origin + path);
      navigate('glow', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'glow did not take it');
    } finally {
      setBusy(false);
    }
  }

  const glowColor = focus?.meta?.accent || accent;

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
          <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: glowColor }}>glow</p>
          <h1 className="text-4xl font-semibold tracking-tight">glow</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">A soft glowing desk for one local file. Drop it with a title, a short caption, and an accent. Soft glass cards settle with spring motion and a gentle radial glow on deep navy. Lands in storage and public_shares. Discord unfurls a polished card. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 relative overflow-hidden"
              style={{ boxShadow: `0 0 60px ${glowColor}33` }}
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor}, transparent 70%)` }} />
              <div className="relative">
                <p className="text-sm text-neutral-500">glow</p>
                <h2 className="text-2xl font-medium mt-1">{focus.name}</h2>
                {focus.caption && <p className="text-neutral-300 mt-3">{focus.caption}</p>}
                <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}</p>
                {focus.file_url && (
                  <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" download>
                    take the file
                  </a>
                )}
              </div>
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional title"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0A84FF]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="mt-1 w-full h-12 rounded-2xl bg-black/30 border border-white/10"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a file on this machine'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm break-all" style={{ color: accent }}>{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">
                {busy ? 'settling…' : 'leave it in the glow'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {shares.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('glow', row.id)}
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
