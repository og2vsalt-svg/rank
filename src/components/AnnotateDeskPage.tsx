import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AnnotateDeskPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF3B30');
  const [brush, setBrush] = useState(6);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [caption, setCaption] = useState('annotated');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const loadImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('please drop an image');
      return;
    }
    setError(null);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = URL.createObjectURL(file);
    setWarn(file.size > 40 * 1024 * 1024 ? 'Large image. Drawing may feel slower. No hard limits.' : null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadImage(f);
  };

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
    ctx.lineWidth = brush;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearAnnotations = () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, x, y, w, h);
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
      const file = new File([blob], 'annotated.png', { type: 'image/png' });
      setWarn(file.size > 40 * 1024 * 1024 ? 'Large result. Sending may feel slow. No hard limits.' : null);
      const res = await publishLocalFile(file, {
        caption: caption || 'annotated image',
        color,
        cardTitle: 'annotated.png',
        meta: { desk: 'annotate', kind: 'annotated-image' },
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
          <p className="text-[13px] font-medium tracking-wide text-[#FF3B30] mb-2">Annotate Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Mark up an image.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local image, draw annotations over it, add a quiet caption, and publish a permanent share. Soft size warnings only. Polished Discord embeds.
          </p>

          <div className="mb-5">
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
              {image ? 'replace image' : 'drop an image'}
            </motion.button>
          </div>

          <div className="flex gap-3 mb-5 items-center">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
            <input type="range" min={2} max={40} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="flex-1 accent-[#FF3B30]" />
            <button onClick={clearAnnotations} disabled={!image} className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 hover:bg-white/15 disabled:opacity-40">clear marks</button>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption"
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#FF3B30]/40"
          />

          <canvas
            ref={canvasRef}
            width={800}
            height={520}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
            className="w-full rounded-2xl border border-white/10 bg-black/40 touch-none cursor-crosshair mb-5"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !image}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF3B30]"
          >
            {busy ? 'Sharing…' : 'Share annotated image'}
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
