import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#0a84ff');
  const [size, setSize] = useState(3);
  const [toast, setToast] = useState('');
  const { navigate } = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setToast('cleared');
    setTimeout(() => setToast(''), 1500);
  };

  const download = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'canvas.png';
    a.click();
    setToast('saved');
    setTimeout(() => setToast(''), 1500);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">canvas</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">draw freely.</h1>
          <p className="text-neutral-400 max-w-xl mb-6">Apple-smooth strokes. No size limits — just paint. Export when ready.</p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer" />
          <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-32" />
          <button onClick={clear} className="px-4 py-2 rounded-full bg-white/5 text-sm hover:bg-white/10">clear</button>
          <button onClick={download} className="px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm hover:bg-[#409cff]">save png</button>
          <button onClick={() => navigate('vault')} className="px-4 py-2 rounded-full glass text-sm">to vault</button>
        </div>
        <div className="glass rounded-3xl overflow-hidden relative">
          <canvas
            ref={canvasRef}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
            className="w-full h-[60vh] touch-none cursor-crosshair bg-black/20"
          />
          {toast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-xs backdrop-blur">
              {toast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
