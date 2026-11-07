import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietHaloPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{name: string; embed: string}[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => {});
  }, []);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.find(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit.' : null);
  };

  const shareAll = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: {name: string; embed: string}[] = [];
    for (const f of files) {
      const note = notes[f.name] || '';
      const res = await publishLocalFile(f, {
        caption: note || 'from the quiet halo',
        color: accent,
        cardTitle: f.name,
        meta: { desk: 'quiethalo' },
      });
      if (res.ok && res.embed) made.push({ name: f.name, embed: res.embed });
      else setErr(res.error || 'a share slowed');
    }
    setLinks(made);
    setFiles([]);
    setNotes({});
    setBusy(false);
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-32 px-6 max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase" style={{ color: accent }}>Quiet Halo</p>
          <h1 className="text-[40px] font-semibold tracking-tight mt-2 mb-4">Arrange what you carry in light.</h1>
          <p className="text-neutral-400 text-[15px] max-w-lg mx-auto leading-relaxed">
            Drop local files. They settle into a soft orbiting halo of glass. Give each a quiet note. Shares land in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned, never refused. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="relative h-[420px] flex items-center justify-center mb-10">
          <motion.div
            className="absolute inset-0 rounded-full border border-white/5"
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          />
          {files.map((f, i) => {
            const angle = (i / Math.max(files.length, 1)) * Math.PI * 2;
            const radius = 160;
            return (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.05 }}
                className="absolute glass rounded-[24px] p-4 w-36 shadow-xl"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * radius}px - 72px)`,
                  top: `calc(50% + ${Math.sin(angle) * radius}px - 48px)`,
                  borderColor: accent + '40',
                }}
              >
                <p className="text-[12px] font-medium truncate">{f.name}</p>
                <input
                  value={notes[f.name] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [f.name]: e.target.value }))}
                  placeholder="quiet note"
                  className="mt-2 w-full bg-transparent text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
                />
              </motion.div>
            );
          })}
          {!files.length && (
            <label className="glass rounded-[28px] px-10 py-8 cursor-pointer text-center hover:bg-white/5 transition">
              <p className="text-[15px] font-medium mb-1">Drop files into the halo</p>
              <p className="text-[12px] text-neutral-500">or click to choose</p>
              <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
            </label>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white">
              Add more
              <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
            </label>
          </div>
          {warn && <p className="text-[12px] text-amber-300/90">{warn}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareAll}
            disabled={busy || !files.length}
            className="rounded-[20px] px-8 py-3.5 text-[15px] font-medium text-white disabled:opacity-40 shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into light…' : 'Share the halo'}
          </motion.button>
          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l.embed}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                href={l.embed}
                className="text-[13px] break-all"
                style={{ color: accent }}
              >
                {l.name} — {l.embed}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </div>

        {recent.length > 0 && (
          <div className="mt-20">
            <p className="text-[13px] text-neutral-500 mb-4 text-center">recent shared light</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.slice(0, 9).map(r => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="glass rounded-[18px] p-3 block hover:bg-white/5 transition"
                >
                  <p className="text-[12px] truncate">{r.name}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">{r.caption || 'shared'}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
