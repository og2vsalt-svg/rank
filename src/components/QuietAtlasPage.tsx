import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

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

export default function QuietAtlasPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#5EEAD4');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'new' | 'size' | 'name'>('new');

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(40);
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
          meta: { desk: 'quietatlas' },
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

  const filtered = useMemo(() => {
    let list = shares.filter((s) =>
      !q ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      (s.caption || '').toLowerCase().includes(q.toLowerCase())
    );
    if (sort === 'size') list = [...list].sort((a, b) => b.size - a.size);
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [shares, q, sort]);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-8 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Atlas</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A still map of shared things.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Browse and search the public record of shares. Drop local files to place them on the atlas. Each lands in storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion and frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search names or captions…"
              className="flex-1 bg-black/20 border border-white/10 rounded-[16px] px-4 py-2.5 text-[14px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-black/20 border border-white/10 rounded-[16px] px-3 py-2.5 text-[14px] text-white focus:outline-none"
            >
              <option value="new">Newest</option>
              <option value="size">Largest</option>
              <option value="name">Name</option>
            </select>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for new files…"
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
            {busy ? 'Placing on the atlas…' : 'Place on atlas'}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3), type: 'spring', stiffness: 120, damping: 20 }}
              className="glass rounded-[22px] p-5 block hover:bg-white/[0.05] transition group"
              style={{ borderTop: `2px solid ${s.color || accent}` }}
            >
              <div className="aspect-video rounded-xl bg-black/30 mb-3 overflow-hidden flex items-center justify-center">
                {s.mime?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{(s.mime || 'file').split('/')[1] || 'file'}</span>
                )}
              </div>
              <p className="text-[14px] font-medium text-neutral-100 truncate">{s.name}</p>
              {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
              <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-500">
                <span>{prettySize(s.size)}</span>
                <span>{s.downloads || 0} arrivals</span>
              </div>
            </motion.a>
          ))}
        </div>

        {!filtered.length && <p className="text-center text-neutral-500 text-sm mt-12">Nothing matches the current view.</p>}
      </div>
    </div>
  );
}
