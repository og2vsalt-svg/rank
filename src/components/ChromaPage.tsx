import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const DEFAULTS = ['#0A84FF', '#AF52DE', '#FF9F0A', '#30D158', '#FF375F', '#64D2FF'];

export default function ChromaPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colors, setColors] = useState(DEFAULTS);
  const [name, setName] = useState('quiet chroma');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const updateColor = (i: number, hex: string) => {
    setColors((c) => c.map((x, idx) => (idx === i ? hex : x)));
  };

  const addColor = () => {
    if (colors.length >= 12) return;
    setColors((c) => [...c, '#F5F5F7']);
  };

  const removeColor = (i: number) => {
    if (colors.length <= 2) return;
    setColors((c) => c.filter((_, idx) => idx !== i));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 1200;
    const h = 630;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, w, h);

    const barH = 280;
    const barY = 160;
    const gap = 12;
    const totalGaps = (colors.length - 1) * gap;
    const barW = (w - 120 - totalGaps) / colors.length;

    colors.forEach((hex, i) => {
      const x = 60 + i * (barW + gap);
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(x, barY, barW, barH, 28);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, barY, barW, 4);
    });

    ctx.fillStyle = '#f5f5f7';
    ctx.font = '600 48px Inter, -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name || 'chroma', w / 2, 100);

    ctx.font = '400 22px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('rankvault · chroma desk', w / 2, 520);
  };

  useEffect(() => {
    draw();
  }, [colors, name]);

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setWarn(null);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('could not render');
      const file = new File([blob], `${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'chroma'}.png`, { type: 'image/png' });
      if (file.size > 40 * 1024 * 1024) setWarn('large render. the browser may feel slow. no hard limits.');
      const res = await publishLocalFile(file, {
        caption: name,
        color: colors[0] || '#0A84FF',
        cardTitle: name,
        meta: { desk: 'chroma', colors },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setWarn(res.error || 'share failed');
      }
    } catch (e: any) {
      setWarn(e.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Chroma</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Compose a quiet chroma.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick colors, name it, and publish a clean image share with polished Discord embeds. Soft size warnings only.
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="chroma name"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex flex-wrap gap-3 mb-8">
            {colors.map((hex, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                />
                <button
                  onClick={() => removeColor(i)}
                  className="text-xs text-neutral-500 hover:text-white px-1"
                  aria-label="remove color"
                >
                  ×
                </button>
              </div>
            ))}
            {colors.length < 12 && (
              <button
                onClick={addColor}
                className="w-12 h-12 rounded-xl border border-dashed border-white/20 text-neutral-400 hover:border-white/40 flex items-center justify-center text-xl"
              >
                +
              </button>
            )}
          </div>

          <div className="rounded-3xl overflow-hidden border border-white/5 mb-8 bg-black/20">
            <canvas ref={canvasRef} className="w-full h-auto" style={{ maxHeight: 320 }} />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="block text-[#0A84FF] text-sm mb-5 truncate text-left"
            >
              {link}
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Share this chroma'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
