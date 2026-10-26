import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

export default function SoftLumenRibbonPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#A78BFA');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const ribbonRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(36);
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
          meta: { desk: 'softlumenribbon' },
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-8 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Ribbon</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A quiet flowing ribbon of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Multi-file drop with shared note and accent. Soft cards that settle along a gentle ribbon in your color, like light woven into a still stream. Files upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the ribbon…"
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
            {busy ? 'Weaving into the ribbon…' : 'Weave into ribbon'}
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

        <div
          ref={ribbonRef}
          className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin"
          style={{ scrollBehavior: 'smooth' }}
        >
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.5), type: 'spring', stiffness: 90, damping: 18 }}
              className="glass rounded-[24px] p-5 min-w-[280px] snap-start block hover:bg-white/[0.04] transition shrink-0"
              style={{ borderLeft: `3px solid ${s.color || accent}` }}
            >
              <div className="aspect-[4/3] rounded-xl bg-black/30 mb-3 overflow-hidden flex items-center justify-center">
                {s.mime?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{(s.mime || 'file').split('/')[1] || 'file'}</span>
                )}
              </div>
              <p className="text-[15px] font-medium text-neutral-100 truncate">{s.name}</p>
              {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
              <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-500">
                <span>{prettySize(s.size)}</span>
                <span>{s.downloads || 0} arrivals</span>
              </div>
            </motion.a>
          ))}
        </div>

        {!shares.length && <p className="text-center text-neutral-500 text-sm mt-12">The ribbon is still. Drop something to start the weave.</p>}
      </div>
    </div>
  );
}
