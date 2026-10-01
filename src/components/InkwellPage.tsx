import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function InkwellPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f5f5f7';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setEmbed('');
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    setBusy(false);
    if (!blob) return;
    const file = new File([blob], 'inkwell.png', { type: 'image/png' });
    setWarn(file.size > 8 * 1024 * 1024 ? 'heavy still. the send may feel slow.' : null);
    const res = await publishLocalFile(file, { caption: 'a mark from the inkwell', color: '#FF9F0A' });
    if (res.embed) setEmbed(res.embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">inkwell</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a mark, not a cabinet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Draw in the pane. If you publish, the png lands in the share database and Discord gets an image card. The stroke itself never leaves until you ask.</p>
        </motion.div>
        <motion.canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => { drawing.current = false; }}
          onPointerLeave={() => { drawing.current = false; }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-8 w-full touch-none rounded-3xl border border-white/10"
        />
        <div className="mt-4 flex gap-2">
          <button onClick={clear} className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white">clear</button>
          <button onClick={publish} disabled={busy} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black disabled:opacity-50">{busy ? 'inking…' : 'publish the mark'}</button>
        </div>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {embed && <p className="mt-3 truncate text-[13px] text-white/70">{embed}</p>}
      </main>
    </div>
  );
}
