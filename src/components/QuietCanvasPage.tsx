import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [size, setSize] = useState(3);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const rect = c.getBoundingClientRect();
      c.width = rect.width * window.devicePixelRatio;
      c.height = rect.height * window.devicePixelRatio;
      const ctx = getCtx();
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const start = (e: React.PointerEvent) => {
    setDrawing(true);
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current;
    const ctx = getCtx();
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
  };

  const publish = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    setWarn(null);
    try {
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
      if (!blob) throw new Error('could not export canvas');
      if (blob.size > 40_000_000) setWarn('Large canvas export. Upload may feel slower.');
      const file = new File([blob], 'quiet-canvas.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'quiet canvas',
        color,
        cardTitle: 'Quiet Canvas',
        meta: { desk: 'quietcanvas', kind: 'drawing' },
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setLink(urls?.embed || null);
      }
    } catch (e: any) {
      setWarn(e.message || 'publish failed');
    }
    setBusy(false);
  }, [caption, color]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-6 md:p-10 shadow-2xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Quiet Canvas</h1>
          <p className="text-neutral-400 text-sm mb-6">Sketch freely on frosted glass. Export and share with a polished Discord embed. Soft warnings only.</p>

          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/20 aspect-[16/9] mb-6">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none cursor-crosshair"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center mb-6">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 rounded-lg bg-transparent border-0" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              size
              <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-blue-500" />
            </label>
            <button onClick={clear} className="px-4 py-2 rounded-full text-sm bg-white/10 hover:bg-white/20 text-white transition">clear</button>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption (optional)"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={publish}
              disabled={busy}
              className="px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-50 transition"
            >
              {busy ? 'publishing…' : 'publish canvas'}
            </button>
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                share link
              </a>
            )}
          </div>
          {warn && <p className="mt-3 text-xs text-amber-400">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
