import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftLumenHarborPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    const big = list.some(f => f.size > 40 * 1024 * 1024);
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
            caption: note.trim() || `harbor of ${f.name}`,
            color: accent,
            cardTitle: f.name,
            meta: { desk: 'softlumenharbor' },
          });
          if (res.ok && res.embed) newLinks.push(res.embed);
          else if (!res.ok) setErr(res.error || 'upload slowed');
        }
      } else if (note.trim()) {
        const blob = new Blob([note.trim()], { type: 'text/plain' });
        const file = new File([blob], 'harbor-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'quiet harbor note',
          meta: { desk: 'softlumenharbor' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else setErr(res.error || 'note failed');
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
    } catch (e: any) {
      setErr(e.message || 'something drifted');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      {/* Gentle harbor waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
            style={{ background: `linear-gradient(to top, ${accent}22, transparent)` }}
            animate={{ y: [0, -12, 0], scaleX: [1, 1.02, 1] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          />
        ))}
      </div>

      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[28px] p-8 shadow-2xl backdrop-blur-xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>softlumenharbor</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">A quiet harbor of shared light.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Soft waves of your accent gently rise and settle while files find their berth. Drop local files or leave a note. Each lands in storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <label className="block mb-4">
            <span className="text-[13px] text-neutral-300 mb-2 block">Drop files into the harbor</span>
            <input type="file" multiple className="hidden" onChange={onDrop} id="harbor-files" />
            <div
              onClick={() => document.getElementById('harbor-files')?.click()}
              className="border border-dashed border-white/15 rounded-[18px] p-6 text-center text-[14px] text-neutral-400 hover:border-white/30 transition cursor-pointer"
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Click or drop local files'}
            </div>
          </label>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A quiet note for the harbor…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
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
            {busy ? 'Berthing…' : 'Share into the harbor'}
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
      </div>
    </div>
  );
}
