import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietRelicPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [lore, setLore] = useState('');
  const [accent, setAccent] = useState('#C7A27C');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const refresh = async () => {
    const list = await listPublicShares(8);
    setShares(list.filter(s => (s as any).meta?.desk === 'relic' || true).slice(0, 6));
  };

  useEffect(() => { refresh(); }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large relic. It may take a quiet moment to settle. No hard limit.' : null);
  };

  const share = async () => {
    if (!file) return setErr('choose a file to preserve');
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const caption = `Relic ${year}${lore ? ': ' + lore.trim() : ''}`;
      const res = await publishLocalFile(file, {
        caption,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'relic', year, lore: lore.trim() || null },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        setFile(null);
        setLore('');
        await refresh();
      } else {
        setErr(res.error || 'the relic paused');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] font-medium tracking-[0.18em] uppercase mb-2" style={{ color: accent }}>Quiet Relic</p>
          <h1 className="text-[36px] font-semibold tracking-tight text-white mb-3">Preserve a quiet moment.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed">
            Drop one local file. Stamp it with a year and a short lore note. It settles into the database as a relic with a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass. All prior desks remain fully intact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-7 mb-12 shadow-2xl"
        >
          <label className="block cursor-pointer rounded-[20px] border-2 border-dashed border-white/10 p-8 text-center mb-5 hover:border-white/20 transition-colors">
            <p className="text-[15px] text-neutral-300">{file ? file.name : 'Choose a local file to preserve'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" className="hidden" onChange={onFile} />
          </label>

          <div className="flex gap-3 mb-4">
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="w-28 bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
            />
            <input
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              placeholder="Short lore or note…"
              className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
            />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Relic accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !file}
            className="w-full rounded-[20px] py-3.5 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Preserving…' : 'Preserve as relic'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
                <a href={link} target="_blank" rel="noreferrer" className="text-[14px] break-all" style={{ color: accent }}>{link}</a>
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-4">
          {shares.slice(0, 4).map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 70, damping: 16 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-4 flex gap-4 items-center"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: (s.color || accent) + '22' }}>
                {s.type?.startsWith('image/') && s.url ? <img src={s.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-[11px] text-neutral-400">file</div>}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-white truncate">{s.name}</p>
                <p className="text-[13px] text-neutral-400 truncate">{s.caption}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
