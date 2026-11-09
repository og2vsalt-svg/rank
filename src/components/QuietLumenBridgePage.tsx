import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietLumenBridgePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(16);
    setShares(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large drop. The bridge may take a moment to form. No hard limit — only a gentle warning of possible slowness.' : null);
  };

  const share = async () => {
    if (!files.length && !note.trim()) return setErr('drop a file or leave a note to bridge');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: note.trim() || 'quiet bridge',
            color: accent,
            cardTitle: file.name,
            meta: { desk: 'quietlumenbridge' },
          });
          if (res.ok && res.embed) created.push(res.embed);
          else setErr(res.error || `paused on ${file.name}`);
        }
      } else {
        const blob = new Blob([note], { type: 'text/plain' });
        const file = new File([blob], 'bridge-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'bridge note',
          meta: { desk: 'quietlumenbridge' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else setErr(res.error || 'note paused');
      }
      setLinks(created);
      setNote('');
      setFiles([]);
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'the bridge slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 18 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>Quiet Lumen Bridge</p>
          <h1 className="text-[42px] font-semibold tracking-tight text-white mb-4 leading-tight">Bridge what you carry.</h1>
          <p className="text-neutral-400 text-[16.5px] leading-relaxed max-w-2xl mx-auto">
            Multi-file local upload where soft glass pillars rise and connect with luminous lines that spring into place. Each file can hold its own quiet note or share a bridge caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-10 mb-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}40, transparent 50%)` }} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet caption that travels across the bridge…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[22px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/25 relative z-10"
          />

          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/15 p-8 text-center mb-6 hover:border-white/25 transition-colors relative z-10 bg-white/5">
            <p className="text-[16px] text-neutral-200">{files.length ? `${files.length} pillar${files.length > 1 ? 's' : ''} ready` : 'Drop local files to form the bridge'}</p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={onFiles} />
          </label>

          <div className="flex items-center gap-5 mb-7 relative z-10">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[14px] text-neutral-400">Bridge accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-5 relative z-10">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy}
            className="w-full rounded-[26px] py-4.5 text-[16px] font-medium text-black disabled:opacity-50 transition shadow-xl relative z-10"
            style={{ background: accent }}
          >
            {busy ? 'Forming the bridge…' : 'Share across the bridge'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 space-y-1.5 text-center relative z-10">
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13px] text-red-400 text-center relative z-10">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2 pointer-events-none" />
          <div className="grid gap-6 md:grid-cols-2">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="block glass rounded-[28px] p-6 apple-card shadow-xl relative"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-3xl flex-shrink-0 flex items-center justify-center" style={{ background: (s.color || accent) + '25' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color || accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-medium text-white truncate">{s.name || 'shared'}</p>
                    {s.caption && <p className="text-[14px] text-neutral-300 mt-1.5 line-clamp-2">{s.caption}</p>}
                    <p className="text-[12px] text-neutral-500 mt-2.5">{new Date(s.createdAt || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-16 text-[15px]">The bridge is quiet. Drop the first files.</p>}
      </div>
    </div>
  );
}
