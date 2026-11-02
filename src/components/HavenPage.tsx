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

export default function HavenPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/haven');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('haven is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/haven?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError('choose one or more files on this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const results = [];
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('could not read the file'));
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/haven', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, title: title || file.name, caption, accent }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'haven did not take it');
        if (data.warn) setWarn(data.warn);
        results.push(data);
      }
      if (results.length) {
        const path = results[0].sharePath || `/haven/${results[0].id}`;
        setLink(window.location.origin + path);
        navigate('haven', results[0].id);
      }
      load().catch(() => {});
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'haven did not take it');
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
          className="max-w-5xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: glowColor }}>haven</p>
          <h1 className="text-4xl font-semibold tracking-tight">haven</h1>
          <p className="text-neutral-400 mt-3 max-w-2xl">A quiet haven for what you carry. Drop one or many local files with a shared title, caption, and soft accent. Glass cards float and settle with spring motion on deep navy. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 relative overflow-hidden max-w-xl"
              style={{ boxShadow: `0 0 40px ${glowColor}22` }}
            >
              <div className="relative">
                <p className="text-sm text-neutral-500">haven</p>
                <h2 className="text-2xl font-medium mt-1">{focus.name}</h2>
                {focus.caption && <p className="text-neutral-300 mt-3">{focus.caption}</p>}
                <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}</p>
                {focus.file_url && /^image\//.test(focus.mime || '') && (
                  <img src={focus.file_url} alt={focus.name} className="mt-4 rounded-2xl max-h-80 object-contain" />
                )}
                {focus.file_url && (
                  <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" download>
                    take the file
                  </a>
                )}
                <button onClick={() => navigate('haven')} className="ml-3 text-sm text-neutral-400 hover:text-white">back to haven</button>
              </div>
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[28px] p-6 mt-8 space-y-4 max-w-xl">
              <label className="block text-sm text-neutral-300">
                shared title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional shared title"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the haven"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/60 transition"
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
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'choose one or more files on this machine'}
              </label>
              {files.some((f) => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large drops. they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm break-all" style={{ color: accent }}>{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">
                {busy ? 'settling into haven…' : 'leave them in the haven'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shares.map((row, i) => (
                <motion.button
                  key={row.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                  onClick={() => navigate('haven', row.id)}
                  className="glass rounded-2xl p-4 text-left hover:-translate-y-1 transition-transform"
                  style={{ boxShadow: `0 0 20px ${row.meta?.accent || accent}11` }}
                >
                  {row.file_url && /^image\//.test(row.mime || '') && (
                    <img src={row.file_url} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />
                  )}
                  <p className="text-white font-medium truncate">{row.name}</p>
                  {row.caption && <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{row.caption}</p>}
                  <p className="text-xs text-neutral-600 mt-2">{prettySize(Number(row.size) || 0)}</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
