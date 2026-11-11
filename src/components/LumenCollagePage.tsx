import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenCollagePage() {
  const { addFiles } = useVault();
  const [images, setImages] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'rendering' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...arr]);
    setStatus('idle');
    setError('');
    setResult(null);
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const renderCollage = async () => {
    if (images.length < 2) {
      setError('drop at least two images');
      return;
    }
    setStatus('rendering');
    setError('');
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('canvas missing');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');

      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      const cell = 400;
      canvas.width = cols * cell;
      canvas.height = rows * cell;
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loaded = await Promise.all(
        images.map(
          (file) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = URL.createObjectURL(file);
            }),
        ),
      );

      loaded.forEach((img, i) => {
        const x = (i % cols) * cell;
        const y = Math.floor(i / cols) * cell;
        const scale = Math.max(cell / img.width, cell / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const ox = x + (cell - w) / 2;
        const oy = y + (cell - h) / 2;
        ctx.drawImage(img, ox, oy, w, h);
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('could not render collage');
      const file = new File([blob], `collage-${Date.now()}.jpg`, { type: 'image/jpeg' });

      setStatus('uploading');
      await addFiles([file], 'collages');
      const res = await publishLocalFile(file, {
        caption: caption || 'lumen collage',
        color,
        cardTitle: 'lumen collage',
        author: 'rankvault',
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setResult({ embed: urls.embed, warn: res.warn || null });
        setStatus('done');
      } else {
        throw new Error(res.error || 'share failed');
      }
    } catch (e: any) {
      setError(e?.message || 'collage failed');
      setStatus('error');
    }
  };

  const large = images.some((f) => f.size > 20 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          lumen collage
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8"
        >
          Drop images. They settle into a quiet grid collage, then publish as one polished file with a Discord embed. Soft warnings only.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <input ref={inputRef} type="file" onChange={onFile} className="hidden" id="collage-file" multiple accept="image/*" />
          <label htmlFor="collage-file" className="cursor-pointer block">
            <div className="text-neutral-400 text-sm mb-1">drop images here</div>
            <div className="text-xs text-neutral-500">or click · multiple ok · images only</div>
          </label>
        </motion.div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-4 px-1">
            large images detected. rendering and upload may feel slow. no hard limit.
          </motion.div>
        )}

        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 grid grid-cols-3 gap-2"
            >
              {images.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative glass rounded-2xl overflow-hidden aspect-square"
                >
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => remove(i)}
                    className="absolute top-1 right-1 bg-black/60 text-xs px-2 py-0.5 rounded-full"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for the Discord card"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={renderCollage}
          disabled={images.length < 2 || status === 'rendering' || status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
        >
          {status === 'rendering' ? 'composing collage…' : status === 'uploading' ? 'publishing to database…' : `create collage from ${images.length} images`}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass rounded-2xl p-4">
              <p className="text-sm font-medium mb-1">collage ready</p>
              <p className="text-xs text-neutral-400 break-all mb-2">{result.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#0A84FF]">
                copy embed link
              </button>
              {result.warn && <p className="text-amber-400 text-xs mt-1">{result.warn}</p>}
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
