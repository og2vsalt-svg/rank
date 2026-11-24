import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ParticleDeskPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState('#0A84FF');
  const [density, setDensity] = useState(80);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [caption, setCaption] = useState('particle field');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const w = canvas.width;
    const h = canvas.height;

    const init = () => {
      particles = [];
      for (let i = 0; i < density; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          r: Math.random() * 3 + 1,
        });
      }
    };
    init();

    let raf: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(11,11,13,0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [color, density]);

  const loadSeed = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('drop an image to seed the field');
      return;
    }
    setError(null);
    setSeeded(true);
    setWarn(file.size > 40 * 1024 * 1024 ? 'Large seed image. The field may feel slower. No hard limits.' : null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadSeed(f);
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not capture field');
      const file = new File([blob], 'particle-field.png', { type: 'image/png' });
      setWarn(file.size > 40 * 1024 * 1024 ? 'Large capture. Sending may feel slow. No hard limits.' : null);
      const res = await publishLocalFile(file, {
        caption: caption || 'particle field',
        color,
        cardTitle: 'particle-field.png',
        meta: { desk: 'particle', kind: 'particle-field', density },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Particle Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A living field of light.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Shape a quiet particle field. Seed it with a local image if you like. Capture and publish a permanent share. Soft size warnings only. Polished Discord embeds on every link.
          </p>

          <div className="mb-5 flex gap-3 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/15 transition"
            >
              {seeded ? 'reseed image' : 'seed with image'}
            </motion.button>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>

          <div className="flex gap-3 mb-5 items-center">
            <span className="text-xs text-neutral-500">density</span>
            <input type="range" min={20} max={200} value={density} onChange={(e) => setDensity(Number(e.target.value))} className="flex-1 accent-[#0A84FF]" />
            <span className="text-xs text-neutral-400 w-8">{density}</span>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption"
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
          />

          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="w-full rounded-2xl border border-white/10 bg-black/40 mb-5"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share the field'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">live share</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
