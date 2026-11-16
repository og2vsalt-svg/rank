import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietSpectrumPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const spectrum = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#0A84FF', '#AF52DE'];

  const onSelect = (list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list);
    if (!arr.length) return;
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. spectrum settle and uploads may feel slower. no hard limit.' : null);
    setFiles(prev => [...prev, ...arr]);
    const urls = arr.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...urls]);
  };

  const publish = useCallback(async () => {
    if (!files.length) return;
    setBusy(true);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'quiet spectrum',
          cardTitle: 'Quiet Spectrum',
          color: '#0A84FF',
          meta: { desk: 'quietspectrum', kind: 'spectrum' },
        });
        if (res.ok && res.id) {
          newLinks.push(shareUrls(res.id).embed);
        } else {
          setWarn(res.error || 'one publish failed');
        }
      }
      setLinks(prev => [...newLinks, ...prev]);
    } catch (e: any) {
      setWarn(e.message || 'could not publish');
    }
    setBusy(false);
  }, [files, note]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 text-center">Quiet Spectrum</h1>
          <p className="text-neutral-400 text-sm mb-8 text-center">Drop files. Soft rainbow spectrum bars settle them into place. Publish with polished Discord embeds. Soft warnings only.</p>

          <div
            className="relative mx-auto w-full min-h-[220px] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-6 p-6"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onSelect(e.dataTransfer.files);
            }}
          >
            <div className="absolute inset-x-4 bottom-4 flex gap-1 h-2">
              {spectrum.map((c, i) => (
                <motion.div
                  key={c}
                  className="flex-1 rounded-full"
                  style={{ background: c }}
                  initial={{ scaleY: 0.3, opacity: 0.4 }}
                  animate={{ scaleY: [0.3, 1, 0.6, 1], opacity: [0.4, 1, 0.7, 1] }}
                  transition={{ duration: 1.8, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <AnimatePresence>
              {previews.map((url, i) => (
                <motion.div
                  key={url}
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 22, delay: i * 0.04 }}
                  className="relative m-2 z-10"
                >
                  {files[i]?.type.startsWith('image/') ? (
                    <img src={url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[10px] border border-white/10">{files[i]?.name.slice(0, 3)}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {files.length === 0 && <p className="text-neutral-500 text-sm z-10">drop or click for files</p>}
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note"
            className="w-full mb-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
          />

          <button
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-50 transition"
          >
            {busy ? 'settling spectrum…' : 'publish spectrum'}
          </button>

          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              {links.map((l, i) => (
                <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-center text-sm text-blue-400 hover:underline truncate">
                  share link {i + 1}
                </a>
              ))}
            </div>
          )}
          {warn && <p className="mt-4 text-xs text-amber-400 text-center">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
