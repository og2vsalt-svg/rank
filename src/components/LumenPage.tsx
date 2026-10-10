import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { useVault, type VaultFile } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function LumenPage() {
  const { files, addFiles } = useVault();
  const { navigate } = useRouter();
  const [selected, setSelected] = useState<VaultFile | null>(null);
  const [glow, setGlow] = useState(true);
  const [caption, setCaption] = useState('');
  const [shared, setShared] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const images = files.filter(f => f.type.startsWith('image/')).slice(0, 24);

  const shareSelected = async () => {
    if (!selected) return;
    const urls = shareUrls(selected.id);
    setShared(urls.embed || urls.direct);
    try { await navigator.clipboard.writeText(urls.embed || urls.direct); } catch {}
  };

  const onDrop = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const res = await addFiles(list, 'lumen');
    if (res.warn) console.info(res.warn);
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">lumen</p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-4">
            light the files.
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-lg">
            A quiet gallery of what you keep. Soft glow, no limits — only the gentle note when a drop is heavy. Share any image with a professional Discord card.
          </p>
        </motion.div>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="glass rounded-3xl p-8 text-center mb-10 cursor-pointer apple-card"
        >
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => onDrop(e.target.files)} />
          <p className="text-neutral-300">Drop images here to light them up</p>
          <p className="text-xs text-neutral-500 mt-1">Large files may take a moment — never refused.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
          {images.map((f, i) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.4 }}
              onClick={() => setSelected(f)}
              className="aspect-square rounded-2xl overflow-hidden glass apple-card relative group"
            >
              <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end p-3">
                <span className="text-xs truncate opacity-0 group-hover:opacity-100 transition">{f.name}</span>
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="glass rounded-3xl max-w-lg w-full p-6 relative"
                onClick={e => e.stopPropagation()}
              >
                <img src={selected.url} alt="" className={`w-full rounded-2xl mb-4 ${glow ? 'shadow-[0_0_60px_rgba(10,132,255,0.35)]' : ''}`} />
                <p className="font-medium mb-1">{selected.name}</p>
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm text-neutral-400 flex items-center gap-2">
                    <input type="checkbox" checked={glow} onChange={e => setGlow(e.target.checked)} />
                    soft glow
                  </label>
                </div>
                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="caption for the card"
                  className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40"
                />
                <div className="flex gap-2">
                  <button onClick={shareSelected} className="flex-1 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] active:scale-[0.98] transition">
                    copy Discord embed
                  </button>
                  <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-full text-sm text-neutral-400 hover:text-white">close</button>
                </div>
                {shared && <p className="mt-3 text-xs text-[#0A84FF] break-all">{shared}</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center">
          <button onClick={() => navigate('vault')} className="text-sm text-[#0A84FF] hover:underline">
            open the full vault →
          </button>
        </div>
      </div>
    </div>
  );
}
