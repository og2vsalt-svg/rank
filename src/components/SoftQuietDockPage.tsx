import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function SoftQuietDockPage() {
  const { files, addFiles, togglePublic } = useVault();
  const [dragging, setDragging] = useState(false);
  const [warn, setWarn] = useState('');
  const [sharing, setSharing] = useState<string | null>(null);
  const [shared, setShared] = useState<{id: string; name: string; url: string}[]>([]);

  const recent = (files || []).filter(f => f.folder === 'dock' || !f.folder).slice(0, 10);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const list = e.dataTransfer.files;
    if (!list?.length) return;
    const total = Array.from(list).reduce((n, f) => n + f.size, 0);
    if (total > 80 * 1024 * 1024) setWarn('substantial drop. the dock may take a moment. nothing is turned away.');
    else setWarn('');
    await addFiles(list, 'dock');
  }, [addFiles]);

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const total = Array.from(list).reduce((n, f) => n + f.size, 0);
    if (total > 80 * 1024 * 1024) setWarn('large selection. may feel slow. still welcome.');
    else setWarn('');
    await addFiles(list, 'dock');
  };

  const share = async (id: string, name: string) => {
    setSharing(id);
    try {
      const res = await togglePublic(id);
      if (res.ok) {
        setShared(prev => [{ id, name, url: window.location.origin + '/s/' + id }, ...prev].slice(0, 8));
      }
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 relative"
        >
          <p className="text-[#0a84ff] text-sm mb-2">soft quiet dock</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">moor your files at the quiet dock.</h1>
          <p className="text-neutral-400 text-sm mb-6">Local-first multi-file drop. Soft glass, spring settling. Share when ready for a polished Discord card. Large files warned only for possible slowness. Prior features untouched.</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-3xl border-2 border-dashed p-10 text-center mb-5 transition ${dragging ? 'border-[#0a84ff] bg-white/5' : 'border-white/10'}`}
          >
            <input type="file" multiple onChange={onSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
            <motion.div animate={{ y: dragging ? -4 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <p className="font-medium">drop or browse</p>
              <p className="text-xs text-neutral-500 mt-1">any size · stays local until shared</p>
            </motion.div>
          </div>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}

          <div className="space-y-2">
            <AnimatePresence>
              {recent.map((f) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500">{(f.size / 1024).toFixed(1)} kb</p>
                  </div>
                  <button
                    onClick={() => share(f.id, f.name)}
                    disabled={sharing === f.id}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    {sharing === f.id ? '…' : f.public ? 'link' : 'share'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {shared.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5 text-xs space-y-1">
              {shared.map(s => (
                <div key={s.id} className="flex justify-between">
                  <span className="truncate">{s.name}</span>
                  <button onClick={() => navigator.clipboard.writeText(s.url)} className="text-[#0a84ff]">copy</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
