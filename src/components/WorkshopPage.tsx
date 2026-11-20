import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Drop = {
  file: File;
  id: string;
  note: string;
  color: string;
  status: 'ready' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function WorkshopPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [globalNote, setGlobalNote] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = useCallback((list: FileList | File[]) => {
    const next: Drop[] = Array.from(list).map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      color: '#0A84FF',
      status: 'ready',
    }));
    setDrops((p) => [...p, ...next]);
  }, []);

  const publishAll = async () => {
    if (!drops.length || busy) return;
    setBusy(true);
    for (const d of drops) {
      if (d.status === 'done') continue;
      setDrops((p) => p.map((x) => x.id === d.id ? { ...x, status: 'uploading' } : x));
      try {
        const res = await publishLocalFile(d.file, {
          caption: d.note.trim() || globalNote.trim() || d.file.name,
          color: d.color,
          meta: { desk: 'workshop', globalNote: globalNote.trim() || null },
        });
        setDrops((p) => p.map((x) =>
          x.id === d.id
            ? { ...x, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : x
        ));
      } catch (e: any) {
        setDrops((p) => p.map((x) => x.id === d.id ? { ...x, status: 'error', error: e.message } : x));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[#FF9F0A] text-[13px] font-medium tracking-wide mb-2">Workshop</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">build and share.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several files. Give each its own note and accent. A global note threads them. Every link gets a polished Discord embed. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#FF9F0A]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#FF9F0A]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#FF9F0A]/40');
              if (e.dataTransfer.files.length) add(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here or click</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
          </div>

          <input
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value)}
            placeholder="Optional global note for all drops"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <AnimatePresence>
            {drops.map((d) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.file.name}</p>
                    <p className="text-xs text-neutral-500">{(d.file.size / 1024 / 1024).toFixed(1)} MB · {d.status}</p>
                  </div>
                  <input type="color" value={d.color} onChange={(e) => setDrops((p) => p.map((x) => x.id === d.id ? { ...x, color: e.target.value } : x))} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
                </div>
                <input
                  value={d.note}
                  onChange={(e) => setDrops((p) => p.map((x) => x.id === d.id ? { ...x, note: e.target.value } : x))}
                  placeholder="Note for this file"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 mb-2 focus:outline-none"
                />
                {d.link && <a href={d.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 break-all">{d.link}</a>}
                {d.error && <p className="text-xs text-red-400">{d.error}</p>}
                {d.file.size > 40 * 1024 * 1024 && <p className="text-xs text-amber-300/70 mt-1">Large — may feel slower. No hard limit.</p>}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publishAll}
            disabled={busy || !drops.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF9F0A] mt-2"
          >
            {busy ? 'Publishing…' : drops.length ? `Publish ${drops.length} drop${drops.length === 1 ? '' : 's'}` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
