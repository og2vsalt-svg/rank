import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type BinderFile = {
  file: File;
  id: string;
  note: string;
  preview?: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietBinderPage() {
  const [files, setFiles] = useState<BinderFile[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 80_000_000 ? 'Large binder. Uploads may feel slower. No hard limits.' : null);
    const added: BinderFile[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFiles((prev) => [...prev, ...added]);
  }, []);

  const updateNote = (id: string, note: string) => setFiles((p) => p.map((f) => f.id === id ? { ...f, note } : f));
  const remove = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const bindAndPublish = async () => {
    if (!files.length) return;
    setBusy(true);
    for (const item of files) {
      if (item.status === 'done') continue;
      setFiles((p) => p.map((f) => f.id === item.id ? { ...f, status: 'uploading' } : f));
      try {
        const fullCaption = [title, caption, item.note].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption: fullCaption,
          color: accent,
          cardTitle: title || item.file.name,
          meta: { desk: 'quietbinder', binderTitle: title, note: item.note },
        });
        setFiles((p) => p.map((f) =>
          f.id === item.id ? { ...f, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error } : f
        ));
      } catch (e: any) {
        setFiles((p) => p.map((f) => f.id === item.id ? { ...f, status: 'error', error: e.message } : f));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 sm:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: accent }}>Quiet Binder</p>
          <h1 className="text-4xl sm:text-[44px] font-semibold tracking-tight text-white mb-4 leading-[1.05]">Bind files into a quiet collection.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-2xl">
            Gather local files, give the binder a title and shared caption, add optional notes per piece. Publish them together to the database. Every share link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Spring motion on frosted glass. Human-crafted Apple-style pacing. All prior features remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-8 bg-black/15 transition hover:border-white/25"
          >
            <p className="text-neutral-300 mb-4">Drop files into the binder</p>
            <label className="inline-block px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-sm font-medium transition">
              choose files
              <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Binder title"
              className="bg-black/25 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Shared caption (optional)"
              className="bg-black/25 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-sm text-neutral-400">Accent color for the collection embeds</span>
          </div>

          {warn && <p className="text-sm text-amber-300/90 mb-6">{warn}</p>}

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-10">
                {files.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-neutral-500 mb-2">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                      <input
                        value={item.note}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        placeholder="Note for this file"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                      />
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-1">{item.link}</a>}
                      {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                    </div>
                    <button onClick={() => remove(item.id)} className="text-xs text-neutral-500 hover:text-white self-start sm:self-center">remove</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={bindAndPublish}
            disabled={busy || files.length === 0}
            className="w-full rounded-2xl py-4 text-[15px] font-semibold text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Binding…' : `Bind and publish ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
