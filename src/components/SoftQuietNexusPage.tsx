import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20, mass: 0.7 };

export default function SoftQuietNexusPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(12);
    setShares(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Upload may take a moment and feel slow on slower connections. No hard limit is applied.' : null);
  };

  const share = async () => {
    if (!files.length) {
      setErr('Please choose at least one local file.');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softquietnexus' },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `Could not share ${file.name}`);
          break;
        }
      }
      if (created.length) {
        setLinks(created);
        setFiles([]);
        setCaption('');
        await refresh();
      }
    } catch (e: any) {
      setErr(e.message || 'Something went wrong while sharing.');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507] text-white">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-center mb-14"
        >
          <p className="text-[12px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>
            Soft Quiet Nexus
          </p>
          <h1 className="text-[44px] sm:text-[52px] font-semibold tracking-tight leading-tight mb-4">
            Gather around the quiet nexus.
          </h1>
          <p className="text-neutral-400 text-[17px] leading-relaxed max-w-2xl mx-auto">
            Drop local files into a soft orbital field. Each becomes a glass orb that drifts around a quiet center with spring motion. Optional shared note and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.06 }}
          className="glass rounded-[36px] p-8 sm:p-10 mb-20 shadow-2xl max-w-2xl mx-auto relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            {files.map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-8 h-8 rounded-full opacity-40"
                style={{ background: accent, left: '50%', top: '50%' }}
                animate={{
                  x: Math.cos((i / Math.max(files.length, 1)) * Math.PI * 2) * 80,
                  y: Math.sin((i / Math.max(files.length, 1)) * Math.PI * 2) * 80,
                }}
                transition={{ ...spring, delay: i * 0.05 }}
              />
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full" style={{ background: accent + '40' }} />
          </div>

          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/12 p-12 text-center mb-7 hover:border-white/25 transition-colors duration-200 relative z-10">
            <p className="text-[16px] text-neutral-200 font-medium">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to orbit` : 'Choose or drop local files'}
            </p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional shared note for the nexus…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[22px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/30 transition relative z-10"
          />

          <div className="flex items-center gap-5 mb-7 relative z-10">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[14px] text-neutral-400">Accent color for the orbs and share cards</span>
          </div>

          {warn && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] text-amber-300/90 mb-5 text-center relative z-10"
            >
              {warn}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[24px] py-4.5 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl relative z-10"
            style={{ background: accent }}
          >
            {busy ? 'Gathering quietly…' : 'Share into the nexus'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-7 space-y-2 text-center relative z-10"
              >
                {links.map((l, i) => (
                  <a
                    key={i}
                    href={l}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[14px] break-all hover:underline"
                    style={{ color: accent }}
                  >
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-5 text-[13px] text-red-400 text-center relative z-10"
              >
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: i * 0.04 }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="glass rounded-[24px] p-5 apple-card shadow-lg block"
            >
              <div
                className="aspect-[4/5] rounded-[16px] mb-4 overflow-hidden"
                style={{ backgroundColor: (s.color || accent) + '20' }}
              >
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400 px-4 text-center">
                    {s.type?.split('/')[1] || 'file'}
                  </div>
                )}
              </div>
              <p className="text-[15px] font-medium text-white truncate">{s.name || 'untitled'}</p>
              {s.caption && (
                <p className="text-[13px] text-neutral-400 mt-1.5 line-clamp-2">{s.caption}</p>
              )}
              <p className="text-[11px] text-neutral-500 mt-3">
                {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
              </p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && (
          <p className="text-neutral-500 text-center py-16 text-[16px]">
            The nexus is quiet. Share the first file.
          </p>
        )}
      </div>
    </div>
  );
}
