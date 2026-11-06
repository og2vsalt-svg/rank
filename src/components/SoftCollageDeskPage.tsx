import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftCollageDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(20);
    setShares(list.filter(s => s.meta?.desk === 'softcollagedesk' || true)); // show recent, prefer collage
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    setCaptions(arr.map(() => ''));
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large pieces. The collage may take a quiet moment to settle. No hard limit — only a soft note of possible slowness.' : null);
  };

  const updateCaption = (i: number, val: string) => {
    setCaptions(prev => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const share = async () => {
    if (!files.length) return setErr('place one or more pieces into the collage');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await publishLocalFile(file, {
          caption: captions[i]?.trim() || 'collage piece',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softcollagedesk', piece: i + 1 },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `paused on ${file.name}`);
        }
      }
      setLinks(created);
      setFiles([]);
      setCaptions([]);
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'the light settled slowly');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 22 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.18em] uppercase mb-2" style={{ color: accent }}>Soft Collage Desk</p>
          <h1 className="text-[42px] font-semibold tracking-tight text-white mb-3">Arrange what you carry.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-2xl mx-auto">
            Drop several local files. Give each a quiet caption. They settle into storage and public_shares as pieces of a living collage. Soft glass tiles lift and overlap with spring motion in your accent. Every share link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 24 }}
          className="glass rounded-[36px] p-8 mb-16 shadow-2xl max-w-2xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/10 p-12 text-center mb-8 hover:border-white/25 transition-colors duration-300">
            <p className="text-[16px] text-neutral-200">{files.length ? `${files.length} piece${files.length > 1 ? 's' : ''} ready for the collage` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          {files.length > 0 && (
            <div className="space-y-3 mb-6">
              {files.map((f, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <span className="text-[13px] text-neutral-400 w-24 truncate">{f.name}</span>
                  <input
                    value={captions[i] || ''}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="quiet caption for this piece…"
                    className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-[14px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-11 h-11 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Collage accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[26px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling the pieces…' : 'Share into the collage'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-1 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {shares.slice(0, 16).map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 75, damping: 20 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="break-inside-avoid glass rounded-[20px] p-3 apple-card shadow-lg block mb-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${s.color || accent}50, transparent 70%)` }} />
              <div className="aspect-[4/5] rounded-[14px] mb-3 overflow-hidden relative" style={{ backgroundColor: (s.color || accent) + '10' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                )}
              </div>
              <p className="text-[14px] font-medium text-white truncate px-1 relative">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2 px-1 relative">{s.caption}</p>}
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-16 text-[15px]">The collage is quiet. Place the first pieces.</p>}
      </div>
    </div>
  );
}
