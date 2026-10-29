import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function AureatePage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [focus, setFocus] = useState<CloudMeta | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#FFD60A');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  async function load() {
    const list = await listPublicShares(36);
    setShares(list.filter(s => s.meta?.source === 'aureate' || !s.meta)); // approximate recent
  }

  useEffect(() => {
    load().catch(() => setError('aureate is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    // fetch specific
    import('../lib/cloudShare').then(({ fetchShare }) => {
      fetchShare(shareId).then(setFocus).catch(() => setFocus(null));
    });
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
    try {
      const newLinks: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption,
          author,
          color,
          cardTitle: title || file.name,
          meta: { source: 'aureate', accent: color },
        });
        if (!res.ok) throw new Error(res.error || 'could not share');
        if (res.warn) setWarn(res.warn);
        const path = `/aureate/${res.id}`;
        newLinks.push(window.location.origin + path);
        if (files.length === 1) navigate('aureate', res.id);
      }
      setLinks(newLinks);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not share');
    } finally {
      setBusy(false);
    }
  }

  const glow = { background: `radial-gradient(circle at 30% 20%, ${color}22, transparent 60%)` };

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
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FFD60A] mb-3">golden share</p>
          <h1 className="text-4xl font-semibold tracking-tight">aureate</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Drop local files into a soft golden glow. Choose an accent, add a title and caption. Each file settles in frosted glass with spring motion. Lands in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-[28px] p-6 mt-8 relative overflow-hidden"
              style={glow}
            >
              <h2 className="text-2xl font-medium">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.fileUrl && (
                <a href={focus.fileUrl} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={share} className="glass rounded-[28px] p-6 mt-8 space-y-4 relative overflow-hidden" style={glow}>
              <label className="block text-sm text-neutral-300">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional, defaults to filename"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FFD60A]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the share"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FFD60A]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FFD60A]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1 w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(', ') : 'choose one or more files on this machine'}
              </label>
              {files.some(f => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large file(s). they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {links.map((l, i) => <p key={i} className="text-sm text-[#FFD60A] break-all">{l}</p>)}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">
                {busy ? 'sharing…' : 'share in gold'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {shares.slice(0, 12).map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('aureate', row.id)}
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
