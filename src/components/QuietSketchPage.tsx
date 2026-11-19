import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietSketchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [size, setSize] = useState(4);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setLink(null);
  };

  const publish = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setWarn(null);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('could not export');
      const file = new File([blob], 'quiet-sketch.png', { type: 'image/png' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large sketch — may feel slow. No hard limits.');
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'A quiet sketch',
        color,
        cardTitle: 'Quiet Sketch',
        meta: { desk: 'quiet-sketch' },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setWarn(res.error || 'publish failed');
    } catch (e: any) {
      setWarn(e.message || 'failed');
    }
    setBusy(false);
  }, [caption, color, busy]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 24 }}
          className="glass rounded-[36px] p-6 md:p-8 relative"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color }}>Quiet Sketch</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Draw freely.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-6">
            Freehand sketch on a quiet dark canvas. Export and publish with a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <div className="relative mb-5 rounded-3xl overflow-hidden border border-white/10 bg-black/40">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="w-full h-80 touch-none cursor-crosshair block"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-5">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              size
              <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24" />
            </label>
            <button onClick={clear} className="text-sm text-neutral-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5">clear</button>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: color }}
          >
            {busy ? 'Publishing…' : 'Publish sketch'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              <p className="text-xs text-neutral-500 mt-1">Discord-ready link</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
