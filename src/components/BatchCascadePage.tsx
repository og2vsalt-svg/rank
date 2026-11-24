import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function BatchCascadePage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ link: string; name: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 100_000_000 ? 'Large batch — may take a moment. No hard limits, just patience.' : null);
    setResults([]);
  }, []);

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const links: { link: string; name: string }[] = [];
    for (const file of files) {
      try {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'batchcascade', sharedTitle: title.trim() || undefined },
        });
        if (res.ok && res.id) {
          links.push({ link: shareUrls(res.id).app, name: file.name });
        }
      } catch {}
    }
    setResults(links);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Batch Cascade</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Many files, one quiet story.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several local files. Share a title, caption, and accent across them. Each gets a permanent link with polished Discord embeds. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files here'}</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse multiple</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Shared title"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Shared caption"
                rows={2}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-neutral-400">Accent</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-neutral-500">{color}</span>
              </div>
              {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
              <ul className="text-sm text-neutral-400 space-y-1 max-h-32 overflow-auto">
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Cascading…' : files.length ? `Cascade ${files.length} share${files.length > 1 ? 's' : ''}` : 'Drop files first'}
          </motion.button>

          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4 space-y-2">
              <p className="text-sm text-neutral-400 mb-2">Ready links</p>
              {results.map((r, i) => (
                <button key={i} onClick={() => navigate('share', r.link.split('/').pop() || '')} className="block text-[#0A84FF] text-sm break-all text-left">{r.name}: {r.link}</button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
