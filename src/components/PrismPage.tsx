import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
  note: string;
};

export default function PrismPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 100_000_000 ? 'Large files may take a moment. No hard limits — just a soft note about speed.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      note: '',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const caption = [note.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: '#5E5CE6',
          cardTitle: item.file.name,
          meta: { desk: 'prism' },
        });
        const link = res.ok && res.id ? shareUrls(res.id).app : undefined;
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="glass rounded-[40px] p-8 md:p-12 border border-white/6"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#5E5CE6] mb-2">Prism</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3 text-white">Light through every file.</h1>
          <p className="text-neutral-400 text-[16px] leading-relaxed mb-10 max-w-xl">
            A quiet multi-file desk. Drop anything, watch previews bloom, add notes, and share with polished Discord embeds. Soft size warnings only — never hard limits.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#5E5CE6]/50'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#5E5CE6]/50')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#5E5CE6]/50');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-[32px] p-20 text-center mb-8 cursor-pointer hover:border-white/25 transition-all duration-300 bg-black/15"
          >
            <p className="text-neutral-200 text-[16px] font-medium">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-2">or click to browse · images get live previews</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {warn && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-amber-400/90 text-sm mb-6 text-center"
            >
              {warn}
            </motion.p>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared note (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-500 resize-none mb-6 focus:outline-none focus:border-[#5E5CE6]/40 transition"
            rows={2}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-square flex flex-col"
                >
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex-1 grid place-items-center text-neutral-500 text-xs px-2 text-center">
                      {item.file.name.slice(0, 24)}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <input
                      value={item.note}
                      onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))}
                      placeholder="note"
                      className="w-full bg-black/40 text-white text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{item.status}</span>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[#5E5CE6] hover:underline">
                          open
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={busy}
              className="w-full py-4 rounded-2xl bg-[#5E5CE6] text-white font-medium tracking-tight disabled:opacity-50 transition"
            >
              {busy ? 'Sharing…' : 'Share all'}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
