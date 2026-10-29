import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile, listPublicShares, fetchShare, type CloudMeta } from '../lib/cloudShare';

const SLOW = 15 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function SoftchamberPage() {
  const { shareId, navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [focus, setFocus] = useState<CloudMeta | null>(null);
  const [title, setTitle] = useState('');
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
    setShares(list.filter(s => (s as any).meta?.source === 'softchamber' || !s));
  }

  useEffect(() => {
    load().catch(() => setError('chamber is quiet'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetchShare(shareId).then(setFocus).catch(() => setFocus(null));
  }, [shareId]);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError('drop one or more files into the chamber');
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
          meta: { source: 'softchamber', accent: color, chamber: true },
        });
        if (!res.ok) throw new Error(res.error || 'could not settle');
        if (res.warn) setWarn(res.warn);
        const path = `/softchamber/${res.id}`;
        newLinks.push(window.location.origin + path);
        if (files.length === 1) navigate('softchamber', res.id);
      }
      setLinks(newLinks);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not settle');
    } finally {
      setBusy(false);
    }
  }

  const chamberGlow = {
    background: `radial-gradient(ellipse at 50% 0%, ${color}18, transparent 70%)`,
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#5AC8FA] mb-3">soft chamber</p>
          <h1 className="text-4xl font-semibold tracking-tight">softchamber</h1>
          <p className="text-neutral-400 mt-3 max-w-2xl leading-relaxed">
            Drop local files into a breathing chamber. Each settles behind soft expanding glass walls with spring motion.
            Shared title, caption, and accent light the space. Lands in storage and the public_shares table.
            Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness.
            Prior desks remain intact.
          </p>

          <AnimatePresence mode="wait">
            {focus ? (
              <motion.article
                key="focus"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                className="glass rounded-[32px] p-8 mt-10 relative overflow-hidden"
                style={chamberGlow}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: `radial-gradient(circle at 40% 30%, ${color}12, transparent 55%)` }}
                />
                <h2 className="text-2xl font-medium relative z-10">{focus.name}</h2>
                {focus.caption && <p className="text-neutral-300 mt-4 leading-relaxed relative z-10">{focus.caption}</p>}
                <p className="text-sm text-neutral-500 mt-4 relative z-10">
                  {prettySize(Number(focus.size) || 0)}
                  {focus.author ? ` · from ${focus.author}` : ''}
                </p>
                {focus.fileUrl && (
                  <a
                    href={focus.fileUrl}
                    className="inline-flex mt-6 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 active:scale-[0.98] transition relative z-10"
                    download
                  >
                    take the file
                  </a>
                )}
                <button
                  onClick={() => navigate('softchamber')}
                  className="ml-3 mt-6 px-5 py-3 rounded-full border border-white/15 text-sm text-neutral-300 hover:bg-white/5 active:scale-[0.98] transition relative z-10"
                >
                  back to chamber
                </button>
              </motion.article>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                onSubmit={share}
                className="glass rounded-[32px] p-8 mt-10 space-y-5 relative overflow-hidden"
                style={chamberGlow}
              >
                <div className="grid md:grid-cols-2 gap-5">
                  <label className="block text-sm text-neutral-300">
                    chamber title
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="optional, shared across drops"
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
                </div>
                <label className="block text-sm text-neutral-300">
                  chamber note
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="a soft note that travels with each file"
                    rows={3}
                    className="mt-1.5 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5AC8FA]/50 transition resize-none"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-neutral-300">
                  accent light
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                  />
                </label>
                <label className="block rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                  {files.length
                    ? files.map(f => `${f.name} · ${prettySize(f.size)}`).join(' · ')
                    : 'drop one or more files from this machine'}
                </label>
                {files.some(f => f.size > SLOW) && (
                  <p className="text-amber-300/90 text-sm">large file(s). they will not be refused. the chamber may feel slow while they settle.</p>
                )}
                {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {links.map((l, i) => (
                  <p key={i} className="text-sm text-[#5AC8FA] break-all">{l}</p>
                ))}
                <button
                  disabled={busy}
                  className="w-full rounded-full bg-white text-black py-3.5 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition"
                >
                  {busy ? 'settling…' : 'settle into the chamber'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {shares.length > 0 && !focus && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 grid sm:grid-cols-2 gap-3"
            >
              {shares.slice(0, 16).map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate('softchamber', row.id)}
                    className="w-full text-left glass rounded-2xl px-4 py-3.5 hover:-translate-y-0.5 transition-transform"
                  >
                    <span className="text-white">{row.name}</span>
                    {row.caption && (
                      <span className="text-neutral-500 text-sm block mt-0.5 line-clamp-1">{row.caption}</span>
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
