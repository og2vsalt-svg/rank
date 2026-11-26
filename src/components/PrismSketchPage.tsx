import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const COLORS = ['#0A84FF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#000000', '#FFFFFF'];

export default function PrismSketchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [size, setSize] = useState(4);
  const [title, setTitle] = useState('quiet sketch');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, c.width, c.height);
    setLink(null);
  };

  const publish = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    setErr('');
    setWarn(null);
    try {
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
      if (!blob) throw new Error('could not export canvas');
      const file = new File([blob], `${title || 'sketch'}.png`, { type: 'image/png' });
      const pub = await publishLocalFile(file, {
        caption: caption || 'a quiet sketch from Prism Sketch',
        cardTitle: title || 'prism sketch',
        color,
      });
      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        setLink(urls.embed);
        setWarn(pub.warn || null);
      } else {
        setErr(pub.error || 'publish failed');
      }
    } catch (e: any) {
      setErr(e?.message || 'something went quiet');
    } finally {
      setBusy(false);
    }
  }, [title, caption, color]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10 text-center"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">prism sketch</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight">draw quietly</h1>
          <p className="mt-3 text-neutral-600 max-w-md mx-auto">
            A living canvas. Sketch freely, then publish the moment as a permanent Discord-ready share.
            Soft size notes only. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-black scale-110' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
          <input
            type="range"
            min="1"
            max="24"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-32 accent-[#0A84FF]"
          />
          <span className="text-sm text-neutral-500">{size}px</span>
          <button onClick={clear} className="rounded-full bg-white px-4 py-1.5 text-sm shadow-sm hover:shadow">
            clear
          </button>
        </div>

        <motion.div
          className="relative mx-auto overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={520}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the embed"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0A84FF]"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0A84FF]"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <motion.button
            onClick={publish}
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-[#0A84FF] px-8 py-3 text-sm font-medium text-white shadow-lg disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish sketch'}
          </motion.button>
        </div>

        <AnimatePresence>
          {link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm"
            >
              <p className="text-sm text-neutral-500">share ready — Discord will unfurl a polished card</p>
              <a href={link} className="mt-2 block break-all text-[#0A84FF] hover:underline">
                {link}
              </a>
              {warn && <p className="mt-2 text-xs text-amber-600">{warn}</p>}
            </motion.div>
          )}
          {err && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-red-500">
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
