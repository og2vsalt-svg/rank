import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function OrbitPathPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('Orbit');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; link: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
    const big = next.some((f) => f.size > 40_000_000);
    setWarn(big ? 'One or more large files — may take a moment. No hard limits.' : null);
  }, []);

  const publishAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const links: { name: string; link: string }[] = [];
    for (const file of files) {
      try {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: `${title} — ${file.name}`,
          meta: { desk: 'orbitpath', sequence: true },
        });
        if (res.ok && res.id) {
          links.push({ name: file.name, link: shareUrls(res.id).app });
        }
      } catch {
        // continue
      }
    }
    setResults(links);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#FF9500] mb-2">Orbit Path</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Orbital shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several local files. They orbit quietly before rising as individual Discord-ready links under one title and accent. Soft warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#FF9500]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#FF9500]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#FF9500]/40');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-6 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop multiple files</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
              <div className="relative h-48 mb-4">
                {files.map((f, i) => {
                  const angle = (i / files.length) * Math.PI * 2;
                  const r = 70;
                  const x = Math.cos(angle) * r;
                  const y = Math.sin(angle) * r;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-2xl glass grid place-items-center text-[10px] text-center px-1 text-neutral-300 border border-white/10"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {f.name.slice(0, 8)}
                    </motion.div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Path title"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Shared caption"
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400">Accent</label>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
                </div>
                {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
              </div>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publishAll}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-xl bg-[#FF9500]"
          >
            {busy ? 'Rising…' : files.length ? `Rise ${files.length} orbit shares` : 'Drop files first'}
          </motion.button>

          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
              {results.map((r) => (
                <button key={r.link} onClick={() => navigate('share', r.link.split('/').pop() || '')} className="block w-full text-left glass rounded-2xl p-3 text-sm text-[#FF9500] truncate">
                  {r.name} → {r.link}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
