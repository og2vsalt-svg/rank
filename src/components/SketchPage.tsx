import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SketchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed?: string; error?: string; warn?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: any) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setResult(null);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setResult({ error: 'could not capture the sketch' });
        setBusy(false);
        return;
      }
      const file = new File([blob], `sketch-${Date.now()}.png`, { type: 'image/png' });
      const res = await publishLocalFile(file, {
        author,
        caption: caption || 'a quiet sketch',
        color,
        cardTitle: caption || 'sketch',
        meta: { accent: color, source: 'sketch', kind: 'image' },
      });
      setResult({
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
      setBusy(false);
    }, 'image/png');
  };

  const copy = async () => {
    if (!result?.embed) return;
    await navigator.clipboard.writeText(result.embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">sketch</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">draw something quiet. share the moment.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            A simple canvas for quiet marks. When you’re ready, the sketch becomes a PNG that lands in storage and the public_shares table.
            The link unfurls a polished Discord card. Soft warning only if the image is unusually large. No hard limits.
            Prior desks stay intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-8 glass rounded-[28px] p-6">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full rounded-2xl bg-black/40 touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
              />
              <span className="text-[13px] text-white/50">ink</span>
            </div>
            <button
              onClick={clear}
              className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white/80 hover:bg-white/15"
            >
              clear
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="title for the card (optional)"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.012 }}
          onClick={share}
          disabled={busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'filing the sketch…' : 'share the sketch'}
        </motion.button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-6 rounded-2xl px-4 py-4"
          >
            {result.embed ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px]">sketch filed</p>
                  <button onClick={copy} className="rounded-full bg-white/10 px-3 py-1 text-[12px]">
                    {copied ? 'copied' : 'copy link'}
                  </button>
                </div>
                <p className="mt-2 break-all text-[12px] text-white/45">{result.embed}</p>
              </>
            ) : (
              <p className="text-[13px] text-red-300">{result.error || 'could not file the sketch'}</p>
            )}
            {result.warn && <p className="mt-2 text-[12px] text-amber-200/80">{result.warn}</p>}
          </motion.div>
        )}
      </main>
    </div>
  );
}
