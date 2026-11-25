import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function NovaDeskPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF453A');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    if (!title && arr[0]) setTitle(arr[0].name.replace(/\.[^.]+$/, ''));
    const big = arr.some((f) => f.size > 55_000_000);
    setWarn(big ? 'Radiant file — may take a moment. Soft warning only, no limits.' : null);
  }, [title]);

  const publish = async () => {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setLinks([]);
    const created: string[] = [];
    for (const file of files) {
      try {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'novadesk' },
        });
        if (res.ok && res.id) created.push(shareUrls(res.id).app);
      } catch {
        // continue the others
      }
    }
    setLinks(created);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />

          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Nova Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Radiant shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop one or many local files into a nova. Shape a shared title, caption, and accent. Each rises as a permanent link with polished Discord embeds. Soft size warnings only. All earlier desks remain.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2');
              if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
            style={{ ringColor: accent }}
          >
            <p className="text-neutral-300 text-[15px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files here'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse · multiple welcome</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && onDrop(e.target.files)} />
          </div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Shared nova title"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Quiet radiant note"
                rows={2}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-neutral-400">Accent</label>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
              </div>
              {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
              <div className="text-xs text-neutral-500 space-y-1">
                {files.map((f) => <p key={f.name + f.size}>{f.name}</p>)}
              </div>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Igniting…' : files.length ? 'Raise the nova' : 'Drop files first'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
                <p className="text-sm text-neutral-400">Nova links</p>
                {links.map((l) => (
                  <button key={l} onClick={() => navigate('share', l.split('/').pop() || '')} className="block text-left text-sm break-all" style={{ color: accent }}>{l}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
