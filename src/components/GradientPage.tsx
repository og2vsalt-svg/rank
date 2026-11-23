import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function GradientPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [c1, setC1] = useState('#0A84FF');
  const [c2, setC2] = useState('#5E5CE6');
  const [angle, setAngle] = useState(135);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad);
    const y = Math.sin(rad);
    const grd = ctx.createLinearGradient(
      w / 2 - x * w / 2,
      h / 2 - y * h / 2,
      w / 2 + x * w / 2,
      h / 2 + y * h / 2,
    );
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }, [c1, c2, angle]);

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) return;
      const file = new File([blob], 'gradient.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: `Gradient · ${c1} → ${c2} · ${angle}°`,
        color: c1,
        cardTitle: 'Gradient',
        meta: { desk: 'gradient', c1, c2, angle },
      });
      if (res.ok && res.id) setLink(shareUrls(res.id).app);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Gradient</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Quiet color fields.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Compose a linear gradient, preview it live, and publish the image as a permanent share with a polished Discord embed. Soft size warnings only.
          </p>

          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full rounded-3xl mb-6 border border-white/10 shadow-2xl"
          />

          <div className="grid grid-cols-2 gap-4 mb-5">
            <label className="flex flex-col gap-1.5 text-sm text-neutral-400">
              Start
              <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="h-12 w-full rounded-xl bg-transparent border border-white/10" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-neutral-400">
              End
              <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="h-12 w-full rounded-xl bg-transparent border border-white/10" />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-neutral-400 mb-6">
            Angle · {angle}°
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="accent-[#0A84FF]"
            />
          </label>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Publish gradient'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-neutral-400 mb-2">Permanent link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-[#0A84FF] text-sm break-all"
              >
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
