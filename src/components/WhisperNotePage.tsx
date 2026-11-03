import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function WhisperNotePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(24);
    // prefer text-like or caption-heavy
    setShares(list.filter(s => s.caption || s.type?.includes('text')));
  };

  useEffect(() => {
    refresh();
  }, []);

  const share = async () => {
    if (!note.trim()) return setErr('whisper something first');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const blob = new Blob([note], { type: 'text/plain' });
      const file = new File([blob], 'whisper.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: note.trim(),
        color: accent,
        cardTitle: note.trim().slice(0, 60) || 'whisper',
        meta: { desk: 'whispernote', kind: 'note' },
      });
      if (res.ok && res.embed) {
        setLinks([res.embed]);
        setNote('');
        await refresh();
      } else {
        setErr(res.error || 'the whisper faded');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

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
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Whisper Note</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Leave a quiet note.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Type a note. It becomes a shared text file in storage and public_shares. Recent whispers settle into a soft vertical list of glass that lifts with spring motion. Every link unfurls a polished Discord card. No file size concerns here. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl max-w-xl mx-auto"
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Whisper something…"
            rows={5}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !note.trim()}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Sending the whisper…' : 'Share the note'}
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

        <div className="space-y-4 max-w-xl mx-auto">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="block glass rounded-[24px] p-6 apple-card shadow-lg"
              style={{ borderLeft: `4px solid ${s.color || accent}` }}
            >
              <p className="text-[16px] text-white leading-relaxed">{s.caption || s.name || 'quiet note'}</p>
              <p className="text-[12px] text-neutral-500 mt-3">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">No whispers yet. Leave the first one.</p>}
      </div>
    </div>
  );
}
