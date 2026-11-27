import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkLumenPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<{url: string; name: string; warn?: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    setFiles(prev => [...prev, ...Array.from(list)].slice(0, 16));
  }, []);

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const pretty = (n: number) => n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n/1024) + ' KB' : (n/1048576).toFixed(1) + ' MB';

  const publish = async () => {
    if (!files.length) return setError('drop files first');
    setPublishing(true); setError(null); setResults([]);
    const out = [];
    for (const file of files) {
      const pub = await publishLocalFile(file, {
        caption: caption.trim() || 'silk lumen',
        cardTitle: title.trim() || file.name,
        color: accent,
        meta: { silkLumen: true }
      });
      if (pub.ok && pub.id) {
        out.push({ url: shareUrls(pub.id).embed, name: file.name, warn: pub.warn || undefined });
      }
    }
    setResults(out);
    setPublishing(false);
    if (!out.length) setError('publish failed');
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} transition={{type:'spring', stiffness:100, damping:20}} className="text-center mb-12">
          <p className="text-[#FF9500] text-sm mb-2">silk lumen</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-3">soft light. lasting shares.</h1>
          <p className="text-neutral-400 max-w-xl mx-auto">Drop local files under one title and accent. They settle with Apple springs. Each link is Discord-ready. Soft warnings only. No limits. No boosting.</p>
        </motion.div>

        <div className="space-y-6 max-w-md mx-auto">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="title" className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none" />
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="caption" rows={3} className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm" />
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={e=>setAccent(e.target.value)} className="w-10 h-10 rounded-full" />
            <span className="text-xs text-neutral-500">accent</span>
          </div>
          <div onClick={()=>inputRef.current?.click()} className="border border-dashed border-white/15 rounded-2xl p-6 text-center cursor-pointer">
            <input ref={inputRef} type="file" multiple hidden onChange={e=>onFiles(e.target.files)} />
            <p className="text-sm text-neutral-400">drop local files</p>
          </div>
          {files.map((f,i) => (
            <div key={i} className="flex justify-between text-sm px-3 py-2 bg-white/5 rounded-xl">
              <span className="truncate">{f.name}</span>
              <span className="text-xs text-neutral-500">{pretty(f.size)}{f.size>40*1024*1024?' · large':''}</span>
              <button onClick={()=>remove(i)} className="text-xs">remove</button>
            </div>
          ))}
          <motion.button whileTap={{scale:0.98}} onClick={publish} disabled={publishing} className="w-full py-3 rounded-full bg-[#FF9500] text-black font-medium">
            {publishing ? 'publishing…' : 'publish'}
          </motion.button>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-12 text-center space-y-3">
              <p className="text-sm text-neutral-400">links ready for Discord</p>
              {results.map((r,i) => (
                <button key={i} onClick={()=>navigator.clipboard.writeText(r.url)} className="block mx-auto px-5 py-2 glass rounded-full text-sm">
                  {r.name} — copy
                </button>
              ))}
              <button onClick={()=>navigate('home')} className="text-sm text-neutral-500 mt-4">home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
