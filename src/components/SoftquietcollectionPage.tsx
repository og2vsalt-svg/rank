import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftquietcollectionPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{id: string; name: string; url: string}[]>([]);

  const handleFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.find(f => f.size > 40 * 1024 * 1024);
    if (big) setWarn('Some files are large — upload may feel slow, but nothing is refused.');
  };

  const uploadAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setWarn('');
    const outs: {id: string; name: string; url: string}[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: caption || 'shared in a quiet collection' });
      if (res.ok && res.id) {
        outs.push({ id: res.id, name: file.name, url: shareUrls(res.id).app });
      }
    }
    setResults(outs);
    setBusy(false);
    setFiles([]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#5AC8FA] text-sm font-medium tracking-wide mb-3">soft quiet collection</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">gather what you carry.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Drop several local files. They land together in the database with one quiet caption. Each receives its own polished Discord embed. Large drops are gently warned about possible slowness — never refused. Human-crafted Apple-style spring motion on frosted glass.
          </p>
        </motion.div>

        <motion.div
          className="glass rounded-[32px] p-8 mb-6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 22 }}
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-3xl h-48 grid place-items-center cursor-pointer hover:border-[#5AC8FA]/50 hover:bg-white/[0.03] transition-all duration-300"
          >
            <div className="text-center">
              <p className="text-white mb-1">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files or click to browse'}</p>
              <p className="text-neutral-500 text-sm">multi-file · no hard limits</p>
            </div>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption for the whole collection (optional)"
            className="mt-6 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#5AC8FA]/50 transition"
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || !files.length}
            onClick={uploadAll}
            className="mt-6 w-full py-3 rounded-2xl bg-[#5AC8FA] text-black font-medium disabled:opacity-50 transition"
          >
            {busy ? 'settling into the collection…' : 'share the collection'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-amber-300 text-sm text-center mb-4">{warn}</motion.p>
          )}
        </AnimatePresence>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
            <p className="text-white mb-4 font-medium">collection ready</p>
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300 truncate max-w-[60%]">{r.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(r.url)} className="px-3 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20">copy</button>
                    <button onClick={() => navigate('s', r.id)} className="px-3 py-1 rounded-full bg-[#5AC8FA] text-black text-xs">open</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
