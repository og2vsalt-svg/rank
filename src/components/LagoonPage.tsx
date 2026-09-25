import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LagoonPage() {
  const [file, setFile] = useState<File | null>(null);
  const [secs, setSecs] = useState(8);
  const [left, setLeft] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const [warn, setWarn] = useState('');

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  const onFile = (f?: File) => {
    if (!f) return;
    if (url) URL.revokeObjectURL(url);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setLeft(null);
    setWarn(f.size > 40 * 1024 * 1024 ? 'deep water. preview might lag. still no hard cap.' : '');
  };

  const ready = left !== null && left <= 0 && url && file;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lagoon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">let a file sit in the water.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. set a short wait, then grab the download when the pool goes still.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{file ? file.name : 'drop something in'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {file && (
            <div className="mt-6 space-y-4">
              <label className="block text-xs text-neutral-500">hold for {secs}s</label>
              <input type="range" min={3} max={30} value={secs} onChange={(e) => setSecs(Number(e.target.value))} className="w-full" />
              <button onClick={() => setLeft(secs)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">start wait</button>
              {left !== null && left > 0 && <p className="text-sm text-neutral-300">still for {left}s</p>}
              {ready && (
                <a href={url} download={file.name} className="inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium">download {file.name}</a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
