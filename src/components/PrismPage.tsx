import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
  accent: string;
};

const ACCENTS = ['#0A84FF', '#AF52DE', '#FF375F', '#30D158', '#FF9F0A', '#5AC8FA', '#BF5AF2'];

export default function PrismPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: Item[] = arr.map((file, i) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      accent: ACCENTS[i % ACCENTS.length],
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
        const res = await publishLocalFile(item.file, {
          caption: item.file.name,
          color: item.accent,
          cardTitle: item.file.name,
          meta: { desk: 'prism' },
        });
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  const setAccent = (id: string, accent: string) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, accent } : i));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2 text-[#AF52DE]">Prism</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Color each drop.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A prismatic surface. Drop local files and give each its own accent. They land in the database with polished Discord embeds that carry the color. Soft size warnings only. Spring animations on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-4 flex items-center gap-4 mb-3"
              >
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-0.5">{item.link}</a>
                  )}
                  {item.error && <p className="text-xs text-red-400 mt-0.5">{item.error}</p>}
                </div>
                <div className="flex gap-1">
                  {ACCENTS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccent(item.id, c)}
                      className={`w-5 h-5 rounded-full border-2 ${
                        item.accent === c ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="text-xs text-neutral-500 hover:text-white px-2"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2 bg-gradient-to-r from-[#0A84FF] to-[#AF52DE]"
          >
            {busy ? 'Publishing…' : items.length ? `Publish ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
