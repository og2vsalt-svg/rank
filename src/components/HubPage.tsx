import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function HubPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(12);
      if (!cancelled) {
        setRecent(list);
        setLoadingRecent(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large batch — uploads may feel slower. No hard limits.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
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
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'hub' },
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
    // refresh recent after publish
    const list = await listPublicShares(12);
    setRecent(list);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Hub</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Central drop.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            The gathering place. Drop local files. They land in the database with polished Discord embeds on every link. Soft size warnings only. Apple-style springs on frosted glass.
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

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the batch"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for embeds</span>
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
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : items.length ? `Publish ${items.length} file${items.length === 1 ? '' : 's'}` : 'Drop a file first'}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Recent shares</h2>
          {loadingRecent ? (
            <p className="text-neutral-500 text-sm">loading recent drops…</p>
          ) : recent.length === 0 ? (
            <p className="text-neutral-500 text-sm">no public shares yet. be the first.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((share, i) => (
                <motion.button
                  key={share.id}
                  onClick={() => navigate('share', share.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 180, damping: 22 }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-4 text-left hover:bg-white/[0.07] transition"
                >
                  {share.type?.startsWith('image/') && share.url ? (
                    <img src={share.url} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 mb-3">
                      {share.type?.split('/')[0] || 'file'}
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{share.name}</p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{share.caption || 'shared via rankvault'}</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
