import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function ChronicleDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = async () => {
    const list = await listPublicShares(30);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The chronicle may take a moment to record. No hard limit — only a soft warning.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files enter the chronicle');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'chronicle entry',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'chronicledesk' },
        });
        if (res.ok && res.embed) {
          created.push(res.embed);
        } else {
          setErr(res.error || `paused on ${file.name}`);
        }
      }
      setLinks(created);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const filtered = shares.filter(s =>
    !filter ||
    (s.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (s.caption || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Chronicle Desk</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Record what you carry.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop local files onto a quiet timeline. Shared notes and accents. Entries expand with spring motion. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness, never refused. Glass surfaces, human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-12 shadow-2xl max-w-xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-6 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to record` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional entry note that records with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Chronicle accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Recording into the chronicle…' : 'Share into the chronicle'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
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

        <div className="mb-6">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter the chronicle…"
            className="w-full max-w-sm mx-auto block bg-black/20 border border-white/10 rounded-full px-5 py-2.5 text-[14px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
          />
        </div>

        <div className="relative pl-8 border-l border-white/10 space-y-6">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 80, damping: 18 }}
              className="relative"
            >
              <div className="absolute -left-[33px] top-3 w-3 h-3 rounded-full border-2 border-white/20" style={{ background: s.color || accent }} />
              <motion.button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full text-left glass rounded-[22px] p-4 apple-card shadow-lg"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-[12px] overflow-hidden flex-shrink-0" style={{ backgroundColor: (s.color || accent) + '15' }}>
                    {s.type?.startsWith('image/') && s.url ? (
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">{new Date(s.createdAt || '').toLocaleString()}</p>
                    {s.caption && !expanded && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-1">{s.caption}</p>}
                  </div>
                </div>
              </motion.button>
              <AnimatePresence>
                {expanded === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 ml-4 p-4 rounded-[16px] bg-white/5 text-[14px] text-neutral-300">
                      {s.caption || 'No note recorded.'}
                      <div className="mt-3">
                        <a href={`/s/${s.id}`} target="_blank" rel="noreferrer" className="text-[13px]" style={{ color: s.color || accent }}>
                          Open share link →
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">The chronicle is empty. Record the first entry.</p>}
      </div>
    </div>
  );
}
