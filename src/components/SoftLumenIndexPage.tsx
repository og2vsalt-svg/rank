import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenIndexPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [all, setAll] = useState<CloudMeta[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(48);
    setAll(list);
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.caption || '').toLowerCase().includes(q) ||
      (s.author || '').toLowerCase().includes(q)
    );
  }, [all, query]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) {
      setFiles(prev => [...prev, ...dropped]);
      const big = dropped.some(f => f.size > 40 * 1024 * 1024);
      setWarn(big ? 'Large files may feel slow to upload. No hard limit — only a gentle warning.' : null);
    }
  };

  const share = async () => {
    if (!files.length && !note.trim()) return setErr('Drop a file or leave a note for the index');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the soft lumen index',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenindex' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      if (note.trim() && !files.length) {
        const blob = new File([note], 'index-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(blob, {
          caption: note.trim(),
          color: accent,
          meta: { desk: 'softlumenindex' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something paused');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-2" style={{ color: accent }}>Soft Lumen Index</p>
          <h1 className="text-[32px] font-semibold tracking-tight leading-tight mb-4">A still index of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Search the public record or drop local files into the index. Soft cards settle in your accent color. Files upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search the index…"
            className="w-full bg-black/30 border border-white/10 rounded-[20px] px-5 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/25 transition"
          />

          <div className="border-2 border-dashed border-white/10 rounded-[24px] p-8 mb-6 text-center hover:border-white/20 transition">
            <p className="text-neutral-300 text-[14px] mb-2">Drag files here or click to attach</p>
            <label className="inline-block px-5 py-2 rounded-full bg-white/5 text-[13px] cursor-pointer hover:bg-white/10 transition">
              Choose files
              <input type="file" multiple className="hidden" onChange={e => {
                const selected = Array.from(e.target.files || []);
                setFiles(prev => [...prev, ...selected]);
                setWarn(selected.some(f => f.size > 40*1024*1024) ? 'Large files may feel slow. No hard limit.' : null);
              }} />
            </label>
            {files.length > 0 && (
              <ul className="mt-4 text-left text-[13px] text-neutral-400 space-y-1">
                {files.map((f, i) => <li key={i}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>)}
              </ul>
            )}
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A quiet note for the index…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[20px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-xl transition"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the index…' : 'Add to index'}
          </motion.button>

          <AnimatePresence>
            {links.map(link => (
              <motion.a
                key={link}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-4 text-[13px] break-all hover:underline"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {filtered.length > 0 && (
          <div className="mt-16">
            <h2 className="text-[18px] font-medium mb-6 text-neutral-200">Index ({filtered.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 90, damping: 16 }}
                  className="glass rounded-[22px] p-5 apple-card"
                >
                  <p className="text-[15px] font-medium text-neutral-100">{s.name || 'shared light'}</p>
                  {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                  <p className="text-[11px] text-neutral-500 mt-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''} · {(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  <a href={`/s/${s.id}`} className="text-[12px] mt-2 inline-block hover:underline" style={{ color: accent }}>open</a>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
