import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietAtriumPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [newLink, setNewLink] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listPublicShares(36);
      setShares(list);
    } catch {
      setShares([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onFile = (f: File | null) => {
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'This file is large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const share = async () => {
    if (!file) return setErr('choose a local file');
    setBusy(true);
    setErr('');
    setNewLink(null);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'from the quiet atrium',
        color: accent,
        cardTitle: title.trim() || file.name,
        meta: { desk: 'quietatrium' },
      });
      if (res.ok && res.embed) {
        setNewLink(res.embed);
        setFile(null);
        setTitle('');
        setNote('');
        await load();
      } else {
        setErr(res.error || 'upload slowed');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10 mb-12 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Atrium</p>
          <h1 className="text-[34px] font-semibold tracking-tight leading-tight mb-3">Light gathers here.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            A still atrium for shared light. Browse recent public drops as floating glass cards, or add one of your own. Files land in storage and the public_shares table. Every link carries a professional Discord embed. Soft spring animations, frosted glass, deep navy. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title for the light (optional)"
              className="bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
            />
            <div className="flex items-center gap-3">
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
              <label className="flex-1 text-[14px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] py-3 px-4 text-center hover:border-white/30 transition">
                {file ? file.name : 'Choose a local file'}
                <input type="file" className="hidden" onChange={e => onFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A quiet note for the atrium…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25 transition"
          />

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !file}
            className="rounded-[18px] px-8 py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the atrium…' : 'Add to the atrium'}
          </motion.button>

          <AnimatePresence>
            {newLink && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={newLink}
                className="block mt-5 text-[13px] break-all"
                style={{ color: accent }}
              >
                {newLink}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500 text-sm">gathering light…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 90, damping: 16 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="glass rounded-[24px] p-5 block apple-card"
              >
                <div className="text-[12px] font-medium mb-2 truncate" style={{ color: s.color || accent }}>{s.cardTitle || s.name}</div>
                {s.caption && <p className="text-[14px] text-neutral-200 leading-snug mb-3 line-clamp-2">{s.caption}</p>}
                <div className="text-[11px] text-neutral-500 flex justify-between">
                  <span>{(s.size / 1024 / 1024).toFixed(1)} MB</span>
                  <span>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
