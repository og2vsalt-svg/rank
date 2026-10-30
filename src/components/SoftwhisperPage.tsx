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

export default function SoftwhisperPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [focus, setFocus] = useState<CloudMeta | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#8AB4F8');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  async function load() {
    const list = await listPublicShares(36);
    setShares(list.filter(s => (s as any).meta?.source === 'softwhisper' || !(s as any).meta));
  }

  useEffect(() => {
    load().catch(() => setError('whisper is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
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
          meta: { source: 'softwhisper', accent: color },
        });
        if (!res.ok) throw new Error(res.error || 'could not share');
        if (res.warn) setWarn(res.warn);
        const path = `/softwhisper/${res.id}`;
        newLinks.push(window.location.origin + path);
        if (files.length === 1) navigate('softwhisper', res.id);
      }
      setLinks(newLinks);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not share');
    } finally {
      setBusy(false);
    }
  }

  const glow = { background: `radial-gradient(ellipse at 50% 30%, ${color}22, transparent 65%)` };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#8AB4F8] mb-3">quiet whisper</p>
          <h1 className="text-4xl font-semibold tracking-tight">softwhisper</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Drop local files into a soft whisper. Choose an accent, add a title and caption. Each settles with a gentle breath and spring motion on frosted glass. Lands in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact.</p>
          {focus ? (
            <motion.article
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              className="glass rounded-[32px] p-6 mt-8 relative overflow-hidden"
              style={glow}
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${color}15, transparent 70%)` }}
              />
              <h2 className="text-2xl font-medium relative">{focus.name}</h2>
              {focus.caption && <p className="text-neutral-300 mt-3 leading-relaxed relative">{focus.caption}</p>}
              <p className="text-sm text-neutral-500 mt-3 relative">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.fileUrl && (
                <a href={focus.fileUrl} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition relative" download>
                  take the file
                </a>
              )}
            </motion.article>
          ) : (
            <motion.form
              onSubmit={share}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-[32px] p-6 mt-8 space-y-4 relative overflow-hidden"
              style={glow}
            >
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 60% 40%, ${color}18, transparent 60%)` }}
              />
              <label className="block text-sm text-neutral-300 relative">
                title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="optional, defaults to filename"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#8AB4F8]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300 relative">
                caption
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a soft note for the share"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#8AB4F8]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300 relative">
                from
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="optional"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#8AB4F8]/60 transition"
                />
              </label>
              <label className="block text-sm text-neutral-300 relative">
                accent
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1 w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer relative">
                <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(', ') : 'choose one or more files on this machine'}
              </label>
              {files.some(f => f.size > SLOW) && <p className="text-amber-300/90 text-sm relative">large file(s). they will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm relative">{warn}</p>}
              {error && <p className="text-red-400 text-sm relative">{error}</p>}
              {links.map((l, i) => <p key={i} className="text-sm text-[#8AB4F8] break-all relative">{l}</p>)}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition relative">
                {busy ? 'sharing…' : 'share in whisper'}
              </button>
            </motion.form>
          )}
          {shares.length > 0 && !focus && (
            <ul className="mt-8 space-y-2">
              {shares.slice(0, 12).map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softwhisper', row.id)}
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
