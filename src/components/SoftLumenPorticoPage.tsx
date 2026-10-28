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

export default function SoftLumenPorticoPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(24);
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
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Some files are large. The upload may feel slow. No hard limit is applied.' : null);
  };

  const share = async () => {
    if (!files.length && !note.trim()) return setErr('Drop a file or leave a quiet note');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      if (files.length) {
        for (const f of files) {
          const res = await publishLocalFile(f, {
            caption: note.trim() || `portico of ${f.name}`,
            color: accent,
            cardTitle: f.name,
            meta: { desk: 'softlumenportico' },
          });
          if (res.ok && res.embed) newLinks.push(res.embed);
          else if (!res.ok) setErr(res.error || 'upload slowed');
        }
      } else if (note.trim()) {
        const blob = new Blob([note.trim()], { type: 'text/plain' });
        const file = new File([blob], 'portico-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'quiet portico note',
          meta: { desk: 'softlumenportico' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else setErr(res.error || 'note failed');
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'something drifted');
    }
    setBusy(false);
  };

  const filtered = useMemo(() => shares.filter((s) =>
    !q ||
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.caption || '').toLowerCase().includes(q.toLowerCase())
  ), [shares, q]);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      {/* Soft portico arches of light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute top-0 w-[28%] opacity-25"
            style={{
              left: `${8 + i * 32}%`,
              height: '55%',
              background: `radial-gradient(ellipse at bottom, ${accent}44 0%, transparent 70%)`,
              borderRadius: '0 0 50% 50%',
            }}
            animate={{ opacity: [0.15, 0.35, 0.15], scaleY: [0.92, 1.04, 0.92] }}
            transition={{ duration: 6 + i * 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-10 mb-12 shadow-2xl backdrop-blur-xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>softlumenportico</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-4">A quiet portico of arched light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            Soft arches of light gently curve and settle while files find shelter beneath the portico. Drop local files or leave a quiet note. Each lands in storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter the portico…"
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-5 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/20 transition"
          />

          <label className="block mb-5">
            <span className="text-[13px] text-neutral-300 mb-2 block">Place files beneath the arches</span>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} id="portico-files" />
            <div
              onClick={() => document.getElementById('portico-files')?.click()}
              className="border border-dashed border-white/15 rounded-[18px] p-6 text-center text-[14px] text-neutral-400 hover:border-white/30 transition cursor-pointer"
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Click or drop local files'}
            </div>
          </label>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note for the portico…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-5 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Arching…' : 'Share into the portico'}
          </motion.button>

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                href={l}
                className="block mt-4 text-[13px] break-all"
                style={{ color: accent }}
              >
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.45), type: 'spring', stiffness: 120, damping: 20 }}
              className="glass rounded-[24px] p-6 block hover:bg-white/[0.04] transition group relative"
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
                <span>{s.downloads || 0} arrivals</span>
              </div>
            </motion.a>
          ))}
        </div>

        {!filtered.length && <p className="text-center text-neutral-500 text-sm mt-16">The portico is open for now.</p>}
      </div>
    </div>
  );
}
