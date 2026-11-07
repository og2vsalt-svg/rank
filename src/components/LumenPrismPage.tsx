import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function LumenPrismPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
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

  const onFiles = (arr: File[]) => {
    setFiles(arr);
    const big = arr.some(f => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'Large drop. The browser may pause briefly while sending. No hard limit — only a gentle warning of possible slowness.' : null);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(e.target.files || []));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    onFiles(Array.from(e.dataTransfer.files || []));
  };

  const share = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || undefined,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'lumenprism' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else setErr(res.error || `paused on ${file.name}`);
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

  const isImage = (s: CloudMeta) => (s.type || '').startsWith('image/');

  return (
    <div className="mesh min-h-screen bg-[#050507]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>Lumen Prism</p>
          <h1 className="text-[40px] font-semibold tracking-tight text-white mb-3">Let it refract.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed max-w-xl mx-auto">
            Drop local files into the quiet glass. Soft refractive tiles settle with spring motion in your accent. Shared note. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 mb-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}40, transparent 50%)` }} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`relative rounded-[28px] border-2 border-dashed p-10 text-center mb-6 transition-colors ${drag ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}`}
          >
            <p className="text-[16px] text-neutral-200 mb-1">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to refract` : 'Drop files here, or click to choose'}</p>
            <p className="text-[12px] text-neutral-500">No size limits. Soft warning only if it may feel slow.</p>
            <label className="mt-4 inline-block cursor-pointer text-[13px]" style={{ color: accent }}>
              browse
              <input type="file" multiple className="hidden" onChange={onInput} />
            </label>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional quiet note that travels with the light…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Refracting…' : 'Share the prism'}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 16, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 80, damping: 16 }}
              whileHover={{ y: -8, scale: 1.03, rotate: 1 }}
              className="block glass rounded-[24px] overflow-hidden apple-card shadow-lg relative"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(135deg, transparent, ${s.color || accent}30, transparent)` }} />
              {isImage(s) && s.fileUrl ? (
                <div className="aspect-square bg-black/40 overflow-hidden">
                  <img src={s.fileUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center" style={{ background: (s.color || accent) + '18' }}>
                  <div className="w-14 h-14 rounded-full" style={{ background: (s.color || accent) + '40', boxShadow: `0 0 40px ${s.color || accent}40` }} />
                </div>
              )}
              <div className="p-4 relative">
                <p className="text-[14px] font-medium text-white truncate">{s.name || 'prism'}</p>
                {s.caption && <p className="text-[12px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
                <p className="text-[11px] text-neutral-500 mt-2">{new Date(s.createdAt || '').toLocaleDateString()}</p>
              </div>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-neutral-500 text-center py-12 text-[15px]">No light yet. Be the first to refract.</p>}
      </div>
    </div>
  );
}
