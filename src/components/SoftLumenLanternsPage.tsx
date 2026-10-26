import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares } from '../lib/cloudShare';

type Share = {
  id: string;
  name: string;
  size: number;
  caption?: string | null;
  color?: string | null;
  createdAt?: string;
  downloads?: number;
  url?: string;
  mime?: string;
};

function prettySize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function SoftLumenLanternsPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#F59E0B');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(28);
      setShares(s.map((m: any) => ({
        id: m.id,
        name: m.name || 'untitled',
        size: m.size || 0,
        caption: m.caption,
        color: m.color,
        createdAt: m.createdAt,
        downloads: m.downloads,
        url: m.url,
        mime: m.type,
      })));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const big = arr.find((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. The upload may feel slow. No hard limit.' : null);
  };

  const drop = async () => {
    if (!files.length) return setErr('choose at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const made: string[] = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'softlumenlanterns' },
        });
        if (res.ok && res.embed) made.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      setLinks(made);
      setFiles([]);
      setCaption('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[28px] p-8 mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Lanterns</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A quiet grove of floating lanterns.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Multi-file drop with shared note and warm accent. Soft lanterns that gently rise, breathe, and glow in your color, like quiet light finding still air. Files upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional note for the lanterns…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[14px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-4">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={drop}
            disabled={busy || !files.length}
            className="w-full sm:w-auto px-8 rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition"
            style={{ background: accent }}
          >
            {busy ? 'Lighting the lanterns…' : 'Light the lanterns'}
          </motion.button>

          <AnimatePresence>
            {links.map((l) => (
              <motion.a key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} href={l} className="block mt-3 text-[13px] break-all" style={{ color: accent }}>
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="relative min-h-[480px] rounded-[32px] overflow-hidden bg-gradient-to-b from-black/40 via-[#0b0b0d] to-black/60">
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 50% 80%, ${accent}22, transparent 70%)` }} />
          <div className="relative flex flex-wrap justify-center gap-x-8 gap-y-12 p-10">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ 
                  opacity: 1, 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  opacity: { delay: Math.min(i * 0.06, 0.6), duration: 0.5 },
                  y: { duration: 3.2 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }
                }}
                className="block w-[160px] group"
                whileHover={{ scale: 1.04, y: -4 }}
              >
                <div 
                  className="relative mx-auto w-24 h-32 rounded-b-full rounded-t-[40%] glass border border-white/10 flex items-end justify-center pb-4 overflow-hidden"
                  style={{ 
                    boxShadow: `0 0 40px ${s.color || accent}44, inset 0 0 20px ${s.color || accent}22`,
                    background: `linear-gradient(to bottom, ${s.color || accent}33, transparent)`
                  }}
                >
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: s.color || accent, boxShadow: `0 0 12px ${s.color || accent}` }} />
                  {s.mime?.startsWith('image/') && s.url && (
                    <img src={s.url} alt="" className="absolute inset-2 rounded-lg object-cover opacity-40 group-hover:opacity-70 transition" />
                  )}
                  <span className="relative z-10 text-[10px] text-white/80 font-medium px-2 text-center truncate w-full">{s.name.slice(0, 12)}</span>
                </div>
                <p className="mt-3 text-center text-[12px] text-neutral-300 truncate">{prettySize(s.size)}</p>
                {s.caption && <p className="text-center text-[11px] text-neutral-500 line-clamp-1">{s.caption}</p>}
              </motion.a>
            ))}
          </div>
          {!shares.length && (
            <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
              The grove is dark. Light a lantern to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
