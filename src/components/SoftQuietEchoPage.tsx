import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietEchoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [echoes, setEchoes] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(8).then(setEchoes).catch(() => {});
  }, []);

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const share = async () => {
    if (files.length === 0 && !note.trim()) return setErr('add a note or local files');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: note.trim() || 'an echo in the quiet',
            color: accent,
            cardTitle: file.name,
            meta: { desk: 'softquietecho' },
          });
          if (res.ok && res.embed) newLinks.push(res.embed);
          else if (!res.ok) setErr(res.error || 'upload failed');
        }
        setFiles([]);
      }
      setLinks(newLinks);
      setNote('');
      const fresh = await listPublicShares(8);
      setEchoes(fresh);
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {[1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/10"
            style={{ width: 80 * i, height: 80 * i }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.05, 0.5],
            }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeOut', delay: i * 0.8 }}
          />
        ))}
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{ background: `${accent}22`, filter: 'blur(40px)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[30px] p-8 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Soft Quiet Echo</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3 text-white">An echo for what you carry.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop one or many local files with a shared note. They send soft concentric echoes that expand and fade with spring motion on deep navy glass. Lands in storage and public_shares. Every share link unfurls a polished Discord card. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note that echoes…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[13px] text-neutral-300 cursor-pointer hover:text-white transition border border-dashed border-white/15 rounded-[16px] py-3 px-4 text-center">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || (files.length === 0 && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Sending the echo…' : 'Drop into the quiet'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-1">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {echoes.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-10">
            <p className="text-[13px] text-neutral-400 mb-4">Recent echoes</p>
            <div className="grid gap-3">
              {echoes.map((item, i) => (
                <motion.a
                  key={item.id}
                  href={`/s/${item.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 130, damping: 16 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/5 transition border border-white/5"
                >
                  <p className="text-[13px] font-medium text-white truncate">{item.name || 'untitled'}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{item.caption || 'no note'}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
