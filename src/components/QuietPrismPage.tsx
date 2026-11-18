import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietPrismPage() {
  const [colors, setColors] = useState(['#0A84FF', '#AF52DE', '#FF9F0A']);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1200;
    canvas.height = 630;
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    colors.forEach((c, i) => grd.addColorStop(i / Math.max(colors.length - 1, 1), c));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [colors]);

  const publish = async () => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setResult(null);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setResult({ error: 'could not render spectrum' });
        setBusy(false);
        return;
      }
      const file = new File([blob], 'quiet-prism.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'quiet prism',
        color: colors[0],
        cardTitle: 'Quiet Prism',
        meta: { desk: 'quietprism', colors },
      });
      setResult(res.ok ? { link: res.embed } : { error: res.error || 'publish failed' });
      setBusy(false);
    }, 'image/png');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2 text-[#AF52DE]">Quiet Prism</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Shape a spectrum.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick colors. A soft spectrum unfolds into a visual image. Caption it and publish to the database with a polished Discord embed. Soft warnings only. No hard limits.
          </p>

          <div className="flex gap-3 mb-6 flex-wrap">
            {colors.map((c, i) => (
              <input
                key={i}
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...colors];
                  next[i] = e.target.value;
                  setColors(next);
                }}
                className="w-12 h-12 rounded-full cursor-pointer border-0"
              />
            ))}
            {colors.length < 5 && (
              <button
                onClick={() => setColors([...colors, '#ffffff'])}
                className="w-12 h-12 rounded-full bg-white/10 text-xs hover:bg-white/20"
              >
                +
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="w-full rounded-2xl mb-6 hidden" />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: colors[0] }}
          >
            {busy ? 'Shaping…' : 'Publish spectrum'}
          </motion.button>

          {result?.link && (
            <p className="mt-4 text-sm">
              <a href={result.link} target="_blank" rel="noreferrer" className="text-blue-400">{result.link}</a>
            </p>
          )}
          {result?.error && <p className="mt-4 text-sm text-red-400">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
