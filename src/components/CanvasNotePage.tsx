import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function CanvasNotePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addFiles } = useVault();
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    draw(e);
  };

  const end = () => setDrawing(false);

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * c.width;
    const y = ((clientY - rect.top) / rect.height) * c.height;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, c.width, c.height);
    setResult(null);
    setStatus('idle');
  };

  const shareCanvas = async () => {
    const c = canvasRef.current;
    if (!c) return;
    setStatus('uploading');
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `canvas-note-${Date.now()}.png`, { type: 'image/png' });
      await addFiles([file], 'canvas');
      const res = await publishLocalFile(file, {
        caption: caption || 'canvas note',
        color,
        cardTitle: 'canvas note',
        author: 'rankvault',
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setResult({ embed: urls.embed, warn: res.warn || null });
        setStatus('done');
      } else {
        setStatus('idle');
      }
    }, 'image/png');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-tight mb-2">
          canvas note
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-6">
          Draw a quiet note. Soft brush on dark glass. Share it as an image that lands in the database with a polished Discord embed. Large drawings warned only for possible slowness. Human-crafted Apple-style pacing. All prior features preserved.
        </p>

        <div className="glass rounded-3xl p-4 mb-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={420}
            className="w-full rounded-2xl touch-none bg-[#0b0b0d] cursor-crosshair"
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0" />
          <input type="range" min={1} max={16} value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="accent-[#0A84FF]" />
          <motion.button whileTap={{ scale: 0.96 }} onClick={clear} className="px-4 py-2 rounded-full bg-white/10 text-sm">clear</motion.button>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="caption…"
            className="glass rounded-2xl px-4 py-2 text-sm outline-none flex-1 min-w-[160px]"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={shareCanvas}
            disabled={status === 'uploading'}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {status === 'uploading' ? 'sharing…' : 'share canvas'}
          </motion.button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 text-sm">
            <p className="text-neutral-400 text-xs break-all">{result.embed}</p>
            {result.warn && <p className="text-amber-400/80 text-xs mt-1">{result.warn}</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
