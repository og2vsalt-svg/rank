import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile, listPublicShares, fetchShare, type CloudMeta } from '../lib/cloudShare';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function SoftQuayPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [focus, setFocus] = useState<CloudMeta | null>(null);
  const [quayName, setQuayName] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  async function load() {
    const list = await listPublicShares(48);
    setShares(list.filter(s => (s as any).meta?.source === 'softquay'));
  }

  useEffect(() => {
    load().catch(() => setError('softquay is resting'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetchShare(shareId).then(setFocus).catch(() => setFocus(null));
  }, [shareId]);

  async function dock(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError('bring one or more files to the quay');
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
          cardTitle: quayName || file.name,
          meta: { source: 'softquay', accent: color, quay: quayName || 'unnamed' },
        });
        if (!res.ok) throw new Error(res.error || 'could not dock');
        if (res.warn) setWarn(res.warn);
        const path = `/softquay/${res.id}`;
        newLinks.push(window.location.origin + path);
        if (files.length === 1) navigate('softquay', res.id);
      }
      setLinks(newLinks);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not dock');
    } finally {
      setBusy(false);
    }
  }

  const glow = { background: `radial-gradient(ellipse at 20% 10%, ${color}18, transparent 55%)` };

  return (
    <div className="min-h-screen bg-[#050506] text-white relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 rounded-full opacity-30"
            style={{ background: color, width: '120%', left: '-10%', top: `${30 + i * 12}%` }}
            animate={{
              x: [0, -40, 0],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.7,
            }}
          />
        ))}
      </div>
      <main className="pt-28 pb-20 px-5 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.24em] uppercase mb-3" style={{ color }}>quiet quay</p>
          <h1 className="text-4xl font-semibold tracking-tight">softquay</h1>
          <p className="text-neutral-400 mt-3 max-w-xl leading-relaxed">
            A still quay where files dock. Drop one or many local files with a shared quay name, caption, and accent light. Each settles along the waterline with spring motion and a gentle ripple. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              className="glass rounded-[32px] p-7 mt-8 relative overflow-hidden"
              style={glow}
            >
              <h2 className="text-2xl font-medium">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.fileUrl && (
                <a href={focus.fileUrl} className="inline-flex mt-6 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <form onSubmit={dock} className="glass rounded-[32px] p-7 mt-8 space-y-4 relative overflow-hidden" style={glow}>
              <label className="block text-sm text-neutral-300">
                quay name
                <input
                  value={quayName}
                  onChange={(e) => setQuayName(e.target.value)}
                  placeholder="optional, defaults to filename"
                  className="mt-1.5 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/50 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the dock"
                  className="mt-1.5 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/50 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1.5 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/50 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300">
                accent
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1.5 w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(', ') : 'bring one or more files to the quay'}
              </label>
              {files.some(f => f.size > SLOW) && <p className="text-amber-300/90 text-sm">large file(s). they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {links.map((l, i) => <p key={i} className="text-sm break-all" style={{ color }}>{l}</p>)}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">
                {busy ? 'docking…' : 'dock on the quay'}
              </button>
            </form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2.5">
              {shares.slice(0, 10).map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softquay', row.id)}
                    className="w-full text-left glass rounded-2xl px-4 py-3.5 hover:-translate-y-0.5 transition-transform"
                  >
                    <span className="text-white">{row.name}</span>
                    {row.caption && <span className="text-neutral-500 text-sm"> · {row.caption.slice(0, 42)}</span>}
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
