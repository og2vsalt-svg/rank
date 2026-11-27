import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function HorizonDeskPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const newResults: typeof results = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.3) / list.length) * 100));
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      try {
        const pub = await publishLocalFile(file, {
          caption: caption || 'Shared from Horizon Desk',
          cardTitle: title || file.name,
          color,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: urls.embed,
            thumb,
            size: file.size,
          });
        } else {
          setError(pub.error || 'upload failed for one file');
        }
      } catch (e: any) {
        setError(e?.message || 'upload error');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults(newResults);
    setUploading(false);
    setProgress(100);
  }, [title, caption, color]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#64D2FF] text-sm tracking-wide mb-3">horizon desk</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">shape the horizon.<br />drop what belongs there.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Set a quiet title, caption, and accent. Then drop local files. Each becomes its own permanent Discord-ready link with a polished embed. Soft size warnings only — no hard limits.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="shared title"
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#64D2FF]/40"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption"
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#64D2FF]/40"
          />
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" />
            <span className="text-xs text-neutral-400">accent</span>
          </div>
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          animate={{
            scale: dragging ? 1.012 : 1,
            borderColor: dragging ? color : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-16 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-12"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/20" style={{ borderTopColor: color }} />
                <p className="text-sm text-neutral-300">settling on the horizon… {progress}%</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xl font-medium mb-2">Drop files here</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow — nothing is blocked.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mb-6">{error}</motion.p>}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <p className="text-sm text-neutral-400 text-center">each link carries a polished Discord embed</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 160, damping: 20 }}
                    className="glass rounded-2xl p-5 flex flex-col gap-3"
                  >
                    {r.thumb && <img src={r.thumb} alt="" className="w-full h-32 object-cover rounded-xl" />}
                    <div>
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-neutral-500">{prettySize(r.size)}</p>
                      {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.url)}
                      className="mt-auto px-4 py-2 rounded-full text-xs font-medium text-white self-start"
                      style={{ background: color }}
                    >
                      copy share link
                    </button>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => navigate('home')} className="block mx-auto mt-6 text-sm text-neutral-500 hover:text-white transition">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
