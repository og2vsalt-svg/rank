import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function ParrelPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const point = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.strokeStyle = ink;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const fileMark = async () => {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    setError('');
    const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'));
    setBusy(false);
    if (!blob) {
      setError('the mark did not export');
      return;
    }
    setBusy(true);
    const file = new File([blob], 'parrel-mark.png', { type: 'image/png' });
    const res = await publishLocalFile(file, { caption: 'a mark from parrel', color: ink });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the mark stayed on the glass');
      return;
    }
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">parrel</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a mark, then a card</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Draw on the glass. Filing turns the canvas into a PNG on the share table. Image drops unfurl with the picture on the Discord card.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.5 }} className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <canvas ref={canvasRef} width={900} height={520} className="h-72 w-full touch-none bg-[#0b0b0d]" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }} />
        </motion.div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {['#0A84FF', '#FF9F0A', '#30D158', '#FF375F', '#F5F5F7'].map((c) => (
            <button key={c} onClick={() => setInk(c)} className="h-8 w-8 rounded-full border border-white/20 transition hover:scale-105" style={{ background: c, outline: ink === c ? '2px solid white' : 'none', outlineOffset: 2 }} aria-label={c} />
          ))}
          <button onClick={fileMark} disabled={busy} className="ml-auto rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'filing…' : 'file the mark'}</button>
        </div>
        {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
        {embed && (
          <div className="mt-4 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
            <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px]">{copied ? 'copied' : 'copy'}</button>
          </div>
        )}
      </main>
    </div>
  );
}
