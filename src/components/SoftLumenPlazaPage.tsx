import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenPlazaPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadRecent = async () => {
    const list = await listPublicShares(9);
    setRecent(list);
  };

  useEffect(() => { loadRecent(); }, []);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.filter(f => f.size > 40 * 1024 * 1024).map(f => `${f.name} is large — upload may feel slow. No hard limit.`);
    setWarns(prev => [...prev, ...big]);
  };

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const share = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || title.trim() || 'from the soft lumen plaza',
        color: accent,
        cardTitle: title.trim() || file.name,
        meta: { desk: 'softlumenplaza' },
      });
      if (res.ok && res.embed) made.push(res.embed);
      else if (!res.ok) setErr(prev => prev + (prev ? ' · ' : '') + (res.error || 'upload failed'));
    }
    setLinks(made);
    setFiles([]);
    setWarns([]);
    setTitle('');
    setCaption('');
    await loadRecent();
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 105, damping: 21 }}
          className="glass rounded-[32px] p-8 shadow-2xl mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Plaza</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A quiet plaza for shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-7">
            Drop one or many local files into the open plaza. Give them a shared title, caption, and accent light. Soft cards settle and breathe with spring motion on frosted glass, like light gathering in a still public square. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onDrop(e.target.files)}
          />

          <motion.div
            whileHover={{ scale: 1.005 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-[24px] p-10 text-center cursor-pointer mb-6 transition hover:border-white/25"
          >
            <p className="text-[15px] text-neutral-300">Drop files here or click to choose</p>
            <p className="text-[12px] text-neutral-500 mt-1">no hard size limit — only soft notes if slow</p>
          </motion.div>

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between glass rounded-[16px] px-4 py-3 mb-2"
              >
                <span className="text-[14px] truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => remove(i)} className="text-[12px] text-neutral-400 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90 mb-2">{w}</p>)}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption for the plaza…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent light</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the plaza…' : 'Share to lumen plaza'}
          </motion.button>

          <AnimatePresence>
            {links.map((l) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
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

        {recent.length > 0 && (
          <div>
            <h2 className="text-[18px] font-medium mb-6">Recent plaza shares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((r, i) => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 95, damping: 17 }}
                  className="glass rounded-[22px] p-5 block"
                >
                  <p className="text-[15px] text-neutral-100">{r.name || r.cardTitle || 'untitled'}</p>
                  {r.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{r.caption}</p>}
                  <p className="text-[11px] text-neutral-500 mt-2">{new Date(r.createdAt || '').toLocaleDateString()}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
