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
  meta?: { accent?: string; files?: any[] };
};

export default function SoftlumenwhisperPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [focus, setFocus] = useState<Share | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#A5B4FC');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/softlumenwhisper');
    const data = await res.json();
    setShares(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => setError('softlumenwhisper is resting right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/softlumenwhisper?id=${encodeURIComponent(shareId)}`)
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
      const res = await fetch('/api/softlumenwhisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filePayloads, title: title || 'whisper', caption, author, accent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not share');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/softlumenwhisper/${data.id}`;
      setLink(window.location.origin + path);
      navigate('softlumenwhisper', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not share');
    } finally {
      setBusy(false);
    }
  }

  const glow = focus?.meta?.accent || accent || '#A5B4FC';

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-2xl opacity-20"
            style={{ background: glow, width: 80 + i * 20, height: 80 + i * 20 }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }}
            initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
          />
        ))}
      </div>
      <main className="pt-28 pb-20 px-5 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#A5B4FC] mb-3">soft lumen whispers</p>
          <h1 className="text-4xl font-semibold tracking-tight">softlumenwhisper</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Soft glowing orbs drift and breathe like quiet whispers of light. Drop one or many local files with a shared note and accent. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. All prior desks remain fully intact.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 relative overflow-hidden"
              style={{ boxShadow: `0 0 40px ${glow}22` }}
            >
              <h2 className="text-2xl font-medium">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3">{focus.warn}</p>}
              {focus.meta?.files && focus.meta.files.length > 1 && (
                <ul className="mt-4 space-y-1 text-sm">
                  {focus.meta.files.map((f: any, i: number) => (
                    <li key={i}><a href={f.url} className="text-[#A5B4FC] hover:underline" download>{f.name} · {prettySize(f.size)}</a></li>
                  ))}
                </ul>
              )}
              {focus.file_url && !focus.meta?.files && (
                <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={share} className="glass rounded-[28px] p-6 mt-8 space-y-4 backdrop-blur-md">
              <label className="block text-sm text-neutral-300">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#A5B4FC]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a shared note"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#A5B4FC]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#A5B4FC]/60 transition"
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
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} · ${prettySize(files.reduce((a, f) => a + f.size, 0))}` : 'choose one or many files on this machine'}
              </label>
              {files.some((f) => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large file(s). they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#A5B4FC] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-[#A5B4FC] text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition hover:bg-[#b8c5fd]">
                {busy ? 'whispering…' : 'share the whisper'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {shares.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softlumenwhisper', row.id)}
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
