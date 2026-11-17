import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function CanvasForgePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [size, setSize] = useState(4);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 800;
    canvas.height = 500;
    ctx.fillStyle = '#0b0b0d';
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

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stop = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('could not export');
      const file = new File([blob], 'canvas-forge.png', { type: 'image/png' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large sketch. Upload may feel slow. No hard limit.');
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'from Canvas Forge',
        color,
        cardTitle: 'Canvas Forge sketch',
        meta: { desk: 'canvasforge' },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'share failed');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color }}>Canvas Forge</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">Sketch, then share.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            A quiet canvas for freehand marks. Export as PNG and publish to the database. Every share link carries a professional Discord embed. Soft size warnings only. Apple spring motion on frosted glass.
          </p>

          <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-black/30 mb-6">
            <canvas
              ref={canvasRef}
              onMouseDown={start}
              onMouseMove={draw}
              onMouseUp={stop}
              onMouseLeave={stop}
              onTouchStart={start}
              onTouchMove={draw}
              onTouchEnd={stop}
              className="w-full h-auto touch-none cursor-crosshair"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-5">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex items-center gap-2 text-[13px] text-neutral-300">
              Stroke
              <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-32" />
            </label>
            <motion.button whileTap={{ scale: 0.96 }} onClick={clear} className="px-4 py-2 rounded-full text-[13px] bg-white/10 hover:bg-white/15 transition">
              Clear
            </motion.button>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption…"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] mb-5 focus:outline-none focus:border-white/20"
          />

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: color }}
          >
            {busy ? 'Publishing…' : 'Share sketch'}
          </motion.button>

          {link && (
            <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} href={link} className="block mt-4 text-[13px] break-all" style={{ color }}>
              {link}
            </motion.a>
          )}
          {err && <p className="mt-3 text-[12px] text-red-400">{err}</p>}
        </motion.div>
      </div>
    </div>
  );
}
