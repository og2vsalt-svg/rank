import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const SIZE = 16;
const CELL = 20;

export default function PixelDeskPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<string[][]>(() => Array.from({ length: SIZE }, () => Array(SIZE).fill('#0b0b0d')));
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('pixel art');

  useEffect(() => {
    draw();
  }, [grid]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = SIZE * CELL;
    canvas.height = SIZE * CELL;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  };

  const paint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.floor(((clientX - rect.left) / rect.width) * SIZE);
    const y = Math.floor(((clientY - rect.top) / rect.height) * SIZE);
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      setGrid(prev => {
        const next = prev.map(row => [...row]);
        next[y][x] = color;
        return next;
      });
    }
  };

  const clear = () => {
    setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill('#0b0b0d')));
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
      const file = new File([blob], 'pixel.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption || 'pixel art',
        color,
        cardTitle: 'pixel.png',
        meta: { desk: 'pixel', kind: 'pixel-art' },
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
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Pixel Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Draw in quiet pixels.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Paint a small grid, choose colors, and publish the result as a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.
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
            onMouseDown={paint}
            onMouseMove={(e) => e.buttons === 1 && paint(e)}
            onTouchStart={paint}
            onTouchMove={paint}
            className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-black/40 touch-none cursor-crosshair mb-5 block"
            style={{ imageRendering: 'pixelated' }}
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share pixel art'}
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
