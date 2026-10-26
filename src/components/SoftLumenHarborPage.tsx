import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function SoftLumenHarborPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(42);
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
    setWarn(big ? 'One or more files are large. The upload may feel slow. No hard limit — only a gentle note of patience.' : null);
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
          meta: { desk: 'softlumenharbor' },
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

  const filtered = useMemo(() => shares.filter((s) =>
    !q ||
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.caption || '').toLowerCase().includes(q.toLowerCase())
  ), [shares, q]);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-10 mb-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}33, transparent 60%)` }} />
          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Soft Lumen Harbor</p>
          <h1 className="text-[34px] font-semibold tracking-tight mb-4 relative">A still harbor for shared light.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 max-w-2xl relative">
            Vessels of files settle into calm water. Drop local files with a shared note and accent. Soft cards gently bob and breathe like boats at rest in your color. Each lands in storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the harbor…"
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-5 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/20 relative"
          />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared note for these vessels…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-5 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 relative"
          />

          <div className="flex items-center gap-5 mb-6 relative">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="text-[14px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} vessel${files.length > 1 ? 's' : ''} ready` : 'Choose local files to moor'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4 relative">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={drop}
            disabled={busy || !files.length}
            className="px-10 rounded-[20px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition relative"
            style={{ background: accent }}
          >
            {busy ? 'Mooring…' : 'Moor & share'}
          </motion.button>

          <AnimatePresence>
            {links.map((l) => (
              <motion.a key={l} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} href={l} className="block mt-4 text-[14px] break-all relative" style={{ color: accent }}>
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 relative">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.5), type: 'spring', stiffness: 120, damping: 20 }}
              className="glass rounded-[24px] p-6 block hover:bg-white/[0.04] transition group"
              style={{ borderTop: `3px solid ${s.color || accent}` }}
            >
              <div className="aspect-[4/3] rounded-2xl bg-black/30 mb-4 overflow-hidden flex items-center justify-center">
                {s.mime?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-700" />
                ) : (
                  <span className="text-[12px] text-neutral-500 uppercase tracking-widest">{(s.mime || 'file').split('/')[1] || 'file'}</span>
                )}
              </div>
              <p className="text-[15px] font-medium text-neutral-100 truncate">{s.name}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1.5 line-clamp-2">{s.caption}</p>}
              <div className="flex items-center justify-between mt-4 text-[12px] text-neutral-500">
                <span>{prettySize(s.size)}</span>
                <span>{s.downloads || 0}</span>
              </div>
            </motion.a>
          ))}
        </div>

        {!filtered.length && <p className="text-center text-neutral-500 text-sm mt-16">The harbor is still for now.</p>}
      </div>
    </div>
  );
}
