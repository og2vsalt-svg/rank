import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Echo = {
  id: string;
  note: string;
  file?: File;
  thumb?: string;
  published?: { id: string; url: string; warn?: string };
};

export default function LumenEchoPage() {
  const { navigate } = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEcho = useCallback(async (file?: File) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let thumb: string | undefined;
    if (file?.type.startsWith('image/')) {
      try { thumb = URL.createObjectURL(file); } catch {}
    }
    const echo: Echo = { id, note: note.trim() || 'quiet echo', file, thumb };
    setEchoes(e => [echo, ...e]);
    setNote('');
    if (file) {
      setPublishing(true);
      try {
        const pub = await publishLocalFile(file, {
          caption: echo.note,
          cardTitle: file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          setEchoes(e => e.map(x => x.id === id ? { ...x, published: { id: pub.id!, url: shareUrls(pub.id!).embed, warn: pub.warn || undefined } } : x));
        }
      } catch {}
      setPublishing(false);
    }
  }, [note, accent]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) addEcho(file);
  }, [addEcho]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} className="text-center mb-12">
          <p className="text-[#AF52DE] text-sm tracking-wide mb-2">lumen echo</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-4">leave a quiet mark.</h1>
          <p className="text-neutral-400 max-w-xl mx-auto leading-relaxed">Drop a local file or write a note. It settles into a living echo with Apple-style springs and becomes a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.</p>
        </motion.div>

        <div className="flex items-center gap-3 max-w-lg mx-auto mb-8">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="a short note…" className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-white/25" onKeyDown={e => e.key === 'Enter' && addEcho()} />
          <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => addEcho()} className="px-5 py-3 rounded-full bg-[#AF52DE] text-white text-sm font-medium">echo</motion.button>
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center mb-10 bg-white/[0.02] backdrop-blur-xl cursor-pointer hover:border-[#AF52DE]/40 transition"
        >
          <input ref={inputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && addEcho(e.target.files[0])} />
          <p className="text-neutral-500 text-sm">{publishing ? 'settling…' : 'drop a file or click to attach'}</p>
          <p className="text-xs text-neutral-600 mt-1">large files may feel slow in the browser — nothing is blocked</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          <AnimatePresence>
            {echoes.map((echo, i) => (
              <motion.div key={echo.id} layout initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.03 }} className="glass rounded-2xl p-5">
                {echo.thumb && <img src={echo.thumb} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />}
                <p className="text-sm mb-2">{echo.note}</p>
                {echo.file && <p className="text-xs text-neutral-500 truncate">{echo.file.name}</p>}
                {echo.published?.warn && <p className="text-xs text-amber-400 mt-1">{echo.published.warn}</p>}
                {echo.published && (
                  <button onClick={() => navigator.clipboard.writeText(echo.published!.url)} className="mt-3 text-xs px-3 py-1.5 rounded-full bg-[#AF52DE]/20 text-[#AF52DE] hover:bg-[#AF52DE]/30 transition">copy link</button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
