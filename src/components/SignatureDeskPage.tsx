import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SignatureDeskPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('signed');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const end = () => setIsDrawing(false);

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not capture');
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption || 'signature',
        color,
        cardTitle: 'signature.png',
        meta: { desk: 'signature', kind: 'signature' },
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
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Signature Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Sign something quiet.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Draw a signature or mark. Publish it as a permanent share with polished Discord embeds. Soft warnings only.
          </p>

          <div className="flex gap-3 mb-5 items-center">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
            <button onClick={clear} className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 hover:bg-white/15">clear</button>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption"
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
          />

          <canvas
            ref={canvasRef}
            width={640}
            height={280}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
            className="w-full rounded-2xl border border-white/10 bg-black/40 touch-none cursor-crosshair mb-5"
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share signature'}
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
