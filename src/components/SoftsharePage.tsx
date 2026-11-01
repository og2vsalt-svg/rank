import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 10 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Share = {
  id: string;
  title: string;
  caption: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  accent: string | null;
  created_at: string;
  warn?: string | null;
};

export default function SoftsharePage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#64d2ff');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/softshare');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('softshare is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/softshare?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a local file');
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
      const res = await fetch('/api/softshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title, caption, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'softshare did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/softshare/${data.id}`;
      setLink(window.location.origin + path);
      navigate('softshare', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'softshare did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#64d2ff]/70 mb-3">softshare</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">share a file with quiet light.</h1>
          <p className="text-neutral-400 mt-4 max-w-xl text-[15px] leading-relaxed">
            Drop one local file. Soft glass cards, spring animations, professional Discord embeds on the link. No hard size limits — only a gentle warning if preview clients may feel slow. Lands in storage and the public_shares table. All prior desks remain intact.
          </p>

          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[32px] p-8 mt-10 apple-card"
              style={{ borderColor: focus.accent ? `${focus.accent}40` : undefined }}
            >
              <p className="text-sm text-neutral-500">shared</p>
              <h2 className="text-2xl font-medium mt-1 tracking-tight">{focus.title || focus.file_name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-4 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-4">{prettySize(Number(focus.size) || 0)}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3">{focus.warn}</p>}
              {focus.file_url && (
                <a href={focus.file_url} className="inline-flex mt-6 px-6 py-3 rounded-full bg-white text-black text-sm font-medium lift" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[32px] p-8 mt-10 space-y-5 apple-card">
              <label className="block text-sm text-neutral-300">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional"
                  className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3.5 text-white outline-none focus:border-[#0a84ff]/50 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short line"
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3.5 text-white outline-none focus:border-[#0a84ff]/50 transition resize-none"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="mt-1.5 h-10 w-20 rounded-xl bg-transparent border border-white/10"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a local file'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#64d2ff] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">
                {busy ? 'sharing…' : 'share softly'}
              </button>
            </form>
          )}

          {shares.length > 0 && (
            <ul className="mt-10 space-y-3">
              {shares.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softshare', row.id)}
                    className="w-full text-left glass rounded-2xl px-5 py-4 hover:-translate-y-0.5 transition-transform apple-card"
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
