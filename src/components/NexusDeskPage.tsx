import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function NexusDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const list = await listPublicShares(20);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The nexus may take a moment to weave. No hard limit — only a soft warning.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('let one or more files enter the nexus');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'nexus thread',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'nexusdesk' },
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

  const positions = shares.map((_, i) => {
    const angle = (i / Math.max(shares.length, 1)) * Math.PI * 2;
    const radius = 140 + (i % 3) * 30;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Nexus Desk</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Weave what you carry.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop local files into a living constellation. They settle as floating nodes connected by light threads. Shared notes and accents. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness, never refused. Spring motion, glass surfaces, human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl max-w-xl mx-auto"
        >
          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-10 text-center mb-6 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to weave` : 'Drop or choose local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional thread note that weaves with every file…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Nexus accent</span>
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
            {busy ? 'Weaving into the nexus…' : 'Share into the nexus'}
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

        <div ref={containerRef} className="relative h-[520px] mx-auto max-w-2xl">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {shares.map((s, i) => {
              if (i === 0) return null;
              const p1 = positions[0];
              const p2 = positions[i];
              return (
                <motion.line
                  key={`line-${s.id}`}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${p2.x}px)`}
                  y2={`calc(50% + ${p2.y}px)`}
                  stroke={s.color || accent}
                  strokeWidth={selected === s.id ? 2.5 : 1}
                  strokeOpacity={0.35}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.8 }}
                />
              );
            })}
          </svg>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-16 h-16 rounded-full glass grid place-items-center text-[11px] text-neutral-300"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              nexus
            </motion.div>
          </div>

          {shares.map((s, i) => {
            const pos = positions[i];
            const isSel = selected === s.id;
            return (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                className="absolute left-1/2 top-1/2"
                style={{ x: pos.x, y: pos.y }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: isSel ? 1.12 : 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 70, damping: 16 }}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                onHoverStart={() => setSelected(s.id)}
                onHoverEnd={() => setSelected(null)}
              >
                <div
                  className="glass rounded-[18px] p-2.5 shadow-lg w-28 origin-center relative overflow-hidden"
                  style={{ borderColor: (s.color || accent) + '40' }}
                >
                  <div className="aspect-square rounded-[12px] mb-1.5 overflow-hidden" style={{ backgroundColor: (s.color || accent) + '15' }}>
                    {s.type?.startsWith('image/') && s.url ? (
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-white truncate">{s.name || 'untitled'}</p>
                </div>
              </motion.a>
            );
          })}
        </div>

        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">The nexus is quiet. Weave the first thread.</p>}
      </div>
    </div>
  );
}
