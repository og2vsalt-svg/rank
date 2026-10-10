import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function DropzonePage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [result, setResult] = useState<{id: string; url: string} | null>(null);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    setBusy(true);
    setWarn(file.size > 25 * 1024 * 1024 ? 'Large file — upload may feel slow, but no hard limit.' : '');
    const res = await publishLocalFile(file, { caption: 'shared via dropzone' });
    setBusy(false);
    if (res.ok && res.id) {
      const url = `${window.location.origin}${window.location.pathname}#s/${res.id}`;
      setResult({ id: res.id, url });
    } else {
      setWarn(res.error || 'Upload failed');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-3 tracking-wide">dropzone</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">drop. share. done.</h1>
          <p className="text-neutral-400 text-lg mb-10">Upload a local file. Get a clean share link with professional Discord embeds. Large files get a friendly warning only.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative mx-auto max-w-md h-64 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer grid place-items-center ${drag ? 'border-[#0a84ff] bg-[#0a84ff]/10 scale-[1.02]' : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
        >
          <div className="text-center px-6">
            <div className="text-5xl mb-3 opacity-70">{busy ? '⏳' : '📁'}</div>
            <p className="text-white font-medium">{busy ? 'uploading…' : 'drop a file here or click to browse'}</p>
            <p className="text-neutral-500 text-sm mt-1">any size · Discord-ready links</p>
          </div>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </motion.div>

        <AnimatePresence>
          {warn && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 text-amber-300 text-sm">{warn}</motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 glass rounded-3xl p-6">
              <p className="text-white mb-3">share link ready</p>
              <div className="flex gap-2 items-center justify-center">
                <code className="text-sm text-[#0a84ff] bg-black/30 px-3 py-1.5 rounded-full truncate max-w-xs">{result.url}</code>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(result.url); }}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-medium active:scale-95"
                >copy</button>
                <button onClick={() => navigate('s', result.id)} className="px-4 py-1.5 rounded-full bg-[#0a84ff] text-white text-xs font-medium active:scale-95">open</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
