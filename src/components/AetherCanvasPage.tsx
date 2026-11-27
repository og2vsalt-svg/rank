import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AetherCanvasPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [lineWidth, setLineWidth] = useState(4);
  const [title, setTitle] = useState('quiet mark');
  const [caption, setCaption] = useState('drawn on aether canvas');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [color, lineWidth]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing]);

  const stop = useCallback(() => setIsDrawing(false), []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not export canvas');
      const file = new File([blob], `${title || 'aether'}.png`, { type: 'image/png' });
      await addFiles([file], 'aethercanvas');
      const pub = await publishLocalFile(file, {
        caption,
        cardTitle: title,
        color,
      });
      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        setResult({ url: urls.embed, warn: pub.warn || undefined });
      } else {
        setError(pub.error || 'publish failed');
      }
    } catch (e: any) {
      setError(e?.message || 'error');
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">aether canvas</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">leave a quiet mark.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Draw freely. The canvas exports as a PNG and uploads to the share database as a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-3xl p-6 mb-8 backdrop-blur-2xl"
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full rounded-2xl bg-black/40 touch-none cursor-crosshair border border-white/10"
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={stop}
          />
          <div className="flex flex-wrap gap-4 items-center mt-6">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              width
              <input type="range" min={1} max={32} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-32" />
              <span className="text-xs">{lineWidth}</span>
            </label>
            <button onClick={clear} className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15 transition">clear</button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the embed"
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="caption"
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={uploading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
        >
          {uploading ? 'publishing…' : 'publish mark'}
        </motion.button>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-sm text-red-400">{error}</motion.p>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass rounded-2xl p-6">
              <p className="text-sm text-neutral-400 mb-2">share link (Discord embed ready)</p>
              {result.warn && <p className="text-xs text-amber-400 mb-3">{result.warn}</p>}
              <div className="flex gap-3">
                <input readOnly value={result.url} className="flex-1 bg-black/30 rounded-xl px-4 py-2 text-sm" />
                <button
                  onClick={() => navigator.clipboard.writeText(result.url)}
                  className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15"
                >copy</button>
              </div>
              <button onClick={() => navigate('home')} className="mt-6 text-sm text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
