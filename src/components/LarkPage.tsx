import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LarkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');

  const draw = async (file: File) => {
    setName(file.name);
    if (file.size > 80 * 1024 * 1024) setWarn('huge audio. decode may hitch, still no hard limit.');
    else setWarn('');
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    const ac = new AudioContext();
    const buf = await file.arrayBuffer();
    const audio = await ac.decodeAudioData(buf.slice(0));
    const data = audio.getChannelData(0);
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a84ff';
    const step = Math.max(1, Math.floor(data.length / w));
    for (let x = 0; x < w; x++) {
      let min = 1;
      let max = -1;
      for (let i = 0; i < step; i++) {
        const v = data[x * step + i] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = ((1 + min) / 2) * h;
      const y2 = ((1 + max) / 2) * h;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
    await ac.close();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lark</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">see the shape of a sound file.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. drop audio and get a waveform. nothing leaves this tab.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors mb-6">
            drop wav, mp3, ogg, anything the browser can decode
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) draw(f); }} />
          </label>
          {name && <p className="text-sm text-neutral-300 mb-3">{name}</p>}
          {warn && <p className="text-xs text-amber-400/80 mb-3">{warn}</p>}
          <canvas ref={canvasRef} width={900} height={220} className="w-full rounded-2xl bg-black/40" />
        </motion.div>
      </div>
    </div>
  );
}
