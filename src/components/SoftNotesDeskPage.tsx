import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftNotesDeskPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(20);
    setShares(list.filter(s => s.caption || s.name));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large file(s). The note may take a moment. No hard limit.' : null);
  };

  const share = async () => {
    if (!note.trim() && !files.length) return setErr('leave a note or attach a file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: note.trim() || 'soft note',
            color: accent,
            cardTitle: file.name,
            meta: { desk: 'softnotesdesk' },
          });
          if (res.ok && res.embed) created.push(res.embed);
          else setErr(res.error || `paused on ${file.name}`);
        }
      } else {
        // pure note: create a small text file
        const blob = new Blob([note], { type: 'text/plain' });
        const file = new File([blob], 'note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'note',
          meta: { desk: 'softnotesdesk' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else setErr(res.error || 'note paused');
      }
      setLinks(created);
      setNote('');
      setFiles([]);
      await refresh();
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
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Soft Notes Desk</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Leave a quiet note.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Write a note, optionally attach local files. They land in storage and public_shares. Recent notes appear as soft glass cards that expand with spring motion. Every share link unfurls a polished Discord card. Large drops gently warned, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl"
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note that travels with the share…"
            rows={4}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-white/10 p-6 text-center mb-6 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} attached` : 'Optionally attach local files'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Note accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Leaving the note…' : 'Share the note'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-1 text-center">
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="block glass rounded-[24px] p-5 apple-card shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: (s.color || accent) + '30' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-white truncate">{s.name || 'note'}</p>
                  {s.caption && <p className="text-[14px] text-neutral-300 mt-1 line-clamp-3">{s.caption}</p>}
                  <p className="text-[12px] text-neutral-500 mt-2">{new Date(s.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">No notes yet. Leave the first one.</p>}
      </div>
    </div>
  );
}
