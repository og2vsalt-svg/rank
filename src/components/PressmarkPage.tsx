import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { uploadShare } from '../lib/db';

export default function PressmarkPage() {
  const [headline, setHeadline] = useState('rankvault');
  const [line, setLine] = useState('A quiet card for a loud link.');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paint = useMemo(() => {
    return () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 1200;
      canvas.height = 630;
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(980, 140, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.fillRect(72, 88, 72, 6);
      ctx.fillStyle = '#f5f5f7';
      ctx.font = '600 64px Inter, system-ui, sans-serif';
      wrap(ctx, headline || 'rankvault', 72, 210, 980, 74);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '400 28px Inter, system-ui, sans-serif';
      wrap(ctx, line || 'Shared from rankvault.', 72, 430, 900, 40);
    };
  }, [headline, line, accent]);

  function draw() {
    paint();
  }

  async function publish() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paint();
    setBusy(true);
    setError('');
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not paint the card');
      const file = new File([blob], 'pressmark.png', { type: 'image/png' });
      const row = await uploadShare(file, line.trim(), '');
      setLink(`${window.location.origin}/s/${row.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 220) : 'could not file the card');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { paint(); }, [paint]);

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 pt-24 pb-24">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm mb-3">
          pressmark
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-semibold tracking-tight mb-3"
        >
          Paint a cover, then file it.
        </motion.h1>
        <p className="text-neutral-400 mb-8 max-w-xl leading-relaxed">
          This desk is a press, not a drawer. The 1200×630 card is drawn here, then uploaded so Discord can unfurl a real image.
        </p>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <canvas ref={canvasRef} className="w-full rounded-2xl bg-black" width={1200} height={630} />
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
            <input value={accent} onChange={(e) => setAccent(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
          </div>
          <textarea value={line} onChange={(e) => setLine(e.target.value)} rows={2} className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={draw} className="rounded-full px-4 py-2 text-sm bg-white/10">
              redraw
            </button>
            <button type="button" onClick={publish} disabled={busy} className="rounded-full px-4 py-2 text-sm bg-white text-black font-medium disabled:opacity-40">
              {busy ? 'filing…' : 'file the cover'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {link && (
            <a href={link} className="mt-3 block text-sm text-[#64d2ff] break-all">
              {link}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(/\s+/);
  let line = '';
  let yy = y;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > max) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = trial;
  }
  if (line) ctx.fillText(line, x, yy);
}
