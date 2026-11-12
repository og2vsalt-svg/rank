import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietSketchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * c.width,
      y: ((clientY - rect.top) / rect.height) * c.height,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, c.width, c.height);
    setResult(null);
    setStatus('idle');
  };

  const publish = async () => {
    const c = canvasRef.current;
    if (!c) return;
    setStatus('uploading');
    setError('');
    setResult(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not export sketch');
      const file = new File([blob], 'quiet-sketch.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption || 'quiet sketch',
        color,
        cardTitle: caption.slice(0, 40) || 'quiet sketch',
        author: 'rankvault',
        meta: { kind: 'sketch' },
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setResult({ embed: urls.embed, warn: res.warn || null });
        setStatus('done');
      } else {
        throw new Error(res.error || 'publish failed');
      }
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          quiet sketch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8 leading-relaxed"
        >
          Draw freely on dark glass. Publish the sketch straight to the database with a polished Discord embed. Soft warnings only if the export feels heavy. No hard limits.
        </motion.p>

        <div className="glass rounded-3xl p-4 mb-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full rounded-2xl touch-none bg-[#0b0b0d] cursor-crosshair"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-neutral-400">ink</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
          <button onClick={clear} className="ml-auto text-xs text-neutral-400 hover:text-white">clear</button>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for the Discord card"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-6 outline-none"
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'publishing…' : 'publish sketch'}
        </motion.button>

        {status === 'done' && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4">
            <p className="text-xs text-neutral-400 break-all mb-2">{result.embed}</p>
            {result.warn && <p className="text-amber-400 text-xs mb-1">{result.warn}</p>}
            <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#0A84FF]">
              copy embed link
            </button>
          </motion.div>
        )}
        {status === 'error' && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}
