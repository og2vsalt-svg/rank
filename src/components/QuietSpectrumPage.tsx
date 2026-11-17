import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function generatePalette(base: string, count = 5): string[] {
  const hex = base.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const colors = [base];
  for (let i = 1; i < count; i++) {
    const factor = 0.6 + (i * 0.15);
    const nr = Math.min(255, Math.floor(r * factor));
    const ng = Math.min(255, Math.floor(g * factor));
    const nb = Math.min(255, Math.floor(b * factor));
    colors.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`);
  }
  return colors;
}

export default function QuietSpectrumPage() {
  const [base, setBase] = useState('#0A84FF');
  const [caption, setCaption] = useState('');
  const [palette, setPalette] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPalette(generatePalette(base));
  }, [base]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 800, h = 400;
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, w, h);
    const barW = w / palette.length;
    palette.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * barW, 0, barW, h);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(caption || 'Quiet Spectrum', w / 2, h - 40);
  };

  useEffect(() => { draw(); }, [palette, caption]);

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setBusy(false); return; }
      const file = new File([blob], 'quiet-spectrum.png', { type: 'image/png' });
      try {
        const res = await publishLocalFile(file, {
          caption: caption || 'A quiet spectrum',
          color: base,
          cardTitle: 'Quiet Spectrum',
          meta: { desk: 'quietspectrum', colors: palette },
        });
        if (res.ok && res.embed) setLink(res.embed);
      } catch (e) {
        console.error(e);
      }
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: base }}>Quiet Spectrum</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Shape a palette.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Choose a base color. A quiet spectrum unfolds. Caption it. The visual settles into the database as an image with a polished Discord embed. Soft warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0" />
            <span className="text-sm text-neutral-400">Base color</span>
          </div>

          <div className="flex gap-2 mb-6 justify-center">
            {palette.map((c, i) => (
              <motion.div
                key={i}
                layout
                className="w-14 h-14 rounded-2xl shadow-lg"
                style={{ background: c }}
                whileHover={{ scale: 1.05 }}
              />
            ))}
          </div>

          <canvas ref={canvasRef} className="w-full rounded-2xl mb-6 hidden" />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the spectrum"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: base }}
          >
            {busy ? 'Shaping…' : 'Publish spectrum'}
          </motion.button>

          {link && (
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="block mt-4 text-center text-sm text-blue-400 truncate"
            >
              {link}
            </motion.a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
