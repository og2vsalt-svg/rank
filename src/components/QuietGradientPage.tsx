import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietGradientPage() {
  const [from, setFrom] = useState('#0A84FF');
  const [to, setTo] = useState('#5E5CE6');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [from, to]);

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not render gradient');
      const file = new File([blob], 'quiet-gradient.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'a quiet gradient',
        color: from,
        cardTitle: 'Quiet Gradient',
        meta: { desk: 'quietgradient', from, to },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
      } else {
        setError(res.error || 'publish failed');
      }
    } catch (e: any) {
      setError(e.message || 'something went quiet');
    }
    setBusy(false);
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: from }}>Quiet Gradient</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Compose a quiet wash of color.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick two colors. A soft linear gradient settles onto frosted glass. Caption it and publish to the database. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style spring motion.
          </p>

          <div className="mb-6 rounded-3xl overflow-hidden border border-white/10">
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto block" />
          </div>

          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              from
              <input type="color" value={from} onChange={(e) => setFrom(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              to
              <input type="color" value={to} onChange={(e) => setTo(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            </label>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional quiet caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {link && (
            <p className="text-sm mb-4">
              <a href={link} target="_blank" rel="noreferrer" className="text-blue-400 underline">{link}</a>
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: from }}
          >
            {busy ? 'Publishing…' : 'Publish gradient'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
