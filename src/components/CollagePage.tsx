import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CollagePage() {
  const { navigate } = useRouter();
  const [images, setImages] = useState<{url: string; name: string}[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter(f => f.type.startsWith('image/'));
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 50_000_000 ? 'Large images may take a moment. No hard limits.' : null);
    const next = arr.map(f => ({ url: URL.createObjectURL(f), name: f.name }));
    setImages(p => [...p, ...next].slice(0, 9));
  }, []);

  const generateCollage = async () => {
    if (images.length < 2 || busy) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 800;
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, size, size);

      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      const cellW = size / cols;
      const cellH = size / rows;

      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        img.src = images[i].url;
        await new Promise(r => { img.onload = r; });
        const x = (i % cols) * cellW;
        const y = Math.floor(i / cols) * cellH;
        const scale = Math.max(cellW / img.width, cellH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, x + (cellW - w) / 2, y + (cellH - h) / 2, w, h);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'collage.png', { type: 'image/png' });
        const res = await publishLocalFile(file, {
          caption: caption || 'quiet collage',
          color: '#0A84FF',
          cardTitle: 'Collage',
          meta: { desk: 'collage', count: images.length },
        });
        if (res.ok && res.id) {
          setLink(shareUrls(res.id).app);
        }
        setBusy(false);
      }, 'image/png');
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Collage</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Arrange quietly.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a few images. They form a simple grid collage, then become a permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files.length) addImages(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop images here</p>
            <p className="text-neutral-500 text-sm mt-1">up to 9 for a clean grid</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && addImages(e.target.files)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <div className="grid grid-cols-3 gap-2 mb-6">
            <AnimatePresence>
              {images.map((img, i) => (
                <motion.div
                  key={img.url}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="aspect-square rounded-xl overflow-hidden bg-white/5 relative"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs grid place-items-center"
                  >×</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <canvas ref={canvasRef} className="hidden" />

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={generateCollage}
            disabled={busy || images.length < 2}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Composing…' : 'Publish collage'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-center"
            >
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
