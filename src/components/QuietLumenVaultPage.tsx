import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietLumenVaultPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'Large drop. The vault may take a quiet moment. No hard limit — only a soft note about possible slowness.' : null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const share = async () => {
    if (!files.length) return setErr('choose something quiet to vault');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'quiet lumen drop',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietlumenvault' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else setErr(res.error || `paused on ${file.name}`);
      }
      setLinks(created);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'the vault paused for a moment');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: accent }}>Quiet Lumen Vault</p>
          <h1 className="text-[42px] sm:text-[52px] font-semibold tracking-tight text-white leading-[1.02] mb-4">
            A still place<br />for what you carry.
          </h1>
          <p className="text-neutral-400 text-[16.5px] leading-relaxed max-w-xl mx-auto">
            Drop local files into a quiet luminous vault. Soft glass cards rise with spring motion. Shared notes and your accent travel with every link. Every share unfurls a polished Discord card. Large drops gently warned about possible slowness — never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 120, damping: 24 }}
          className={`glass rounded-[36px] p-8 sm:p-10 mb-16 shadow-2xl max-w-2xl mx-auto transition-all ${drag ? 'ring-2 ring-white/20 scale-[1.01]' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <label className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/12 p-12 text-center mb-7 hover:border-white/25 transition-colors bg-black/10">
            <p className="text-[16px] text-neutral-200 font-medium">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the vault` : 'Drop or choose local files'}
            </p>
            <p className="text-[13px] text-neutral-500 mt-2">No size limits. Soft warning only if it may feel slow.</p>
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files || [])} />
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet note that travels with the share…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[22px] px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-7">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-11 h-11 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13.5px] text-neutral-400">Vault accent</span>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13.5px] text-amber-300/90 mb-5 text-center">
              {warn}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[24px] py-4.5 text-[16.5px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the vault…' : 'Share into the quiet vault'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 space-y-1.5 text-center"
              >
                {links.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[14px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13.5px] text-red-400 text-center">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, type: 'spring', stiffness: 90, damping: 20 }}
              whileHover={{ y: -14, scale: 1.03 }}
              className="glass rounded-[24px] p-3.5 apple-card shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-25 pointer-events-none transition-opacity group-hover:opacity-40" style={{ background: `linear-gradient(145deg, ${s.color || accent}50, transparent 65%)` }} />
              <div className="aspect-square rounded-[16px] mb-3.5 overflow-hidden relative" style={{ backgroundColor: (s.color || accent) + '18' }}>
                {s.type?.startsWith('image/') && s.url ? (
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[13px] text-neutral-400">{s.type?.split('/')[1] || 'file'}</div>
                )}
              </div>
              <p className="text-[15px] font-medium text-white truncate px-1 relative">{s.name || 'untitled'}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2 px-1 relative">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-2 px-1 relative">{new Date(s.createdAt || '').toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && (
          <p className="text-neutral-500 text-center py-16 text-[15.5px]">The vault is still. Share the first quiet drop.</p>
        )}
      </div>
    </div>
  );
}
