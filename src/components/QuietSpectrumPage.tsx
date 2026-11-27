import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function extractColors(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      canvas.width = 32; canvas.height = 32;
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const hex = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
        colors.add(hex);
      }
      URL.revokeObjectURL(url);
      resolve(Array.from(colors).slice(0, 6));
    };
    img.src = url;
  });
}

export default function QuietSpectrumPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (f: File | null) => {
    setFile(f);
    setColors([]);
    if (f && f.type.startsWith('image/')) {
      const cols = await extractColors(f);
      setColors(cols);
    }
  }, []);

  const publish = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    const palette = colors.length ? `palette: ${colors.join(' ')}` : '';
    const pub = await publishLocalFile(file, {
      caption: palette || title || 'spectrum share',
      cardTitle: title || file.name,
      color: colors[0] || '#0A84FF',
    });
    if (pub.ok && pub.id) {
      const urls = shareUrls(pub.id);
      setResult({ url: urls.embed, warn: pub.warn || undefined });
    }
    setUploading(false);
  }, [file, title, colors]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} className="text-center mb-12">
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">quiet spectrum</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">colors from the light inside.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Drop a local image. A living palette settles with Apple-style springs. Publish with the colors carried in the caption as a permanent Discord-ready link. Soft size warnings only.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 space-y-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="quiet title" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition" />
          <button onClick={() => inputRef.current?.click()} className="w-full py-10 border border-dashed border-white/10 rounded-2xl text-neutral-400 hover:text-white hover:border-white/20 transition">
            {file ? file.name : 'drop or choose an image'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />

          {file && file.size > 40 * 1024 * 1024 && <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>}

          <div className="flex flex-wrap gap-3 justify-center">
            <AnimatePresence>
              {colors.map((c, i) => (
                <motion.div key={c} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16, delay: i * 0.05 }} className="w-12 h-12 rounded-full border border-white/10" style={{ background: c }} />
              ))}
            </AnimatePresence>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={uploading || !file} className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50">
            {uploading ? 'publishing…' : 'publish spectrum'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 mt-8 text-center space-y-4">
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigator.clipboard.writeText(result.url)} className="px-6 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition">copy share link</button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
