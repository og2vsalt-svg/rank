import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Tile = { id: string; url: string; name: string };

export default function MosaicPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [cols, setCols] = useState(3);
  const [warn, setWarn] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const next: Tile[] = [];
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      if (f.size > 20 * 1024 * 1024) setWarn(`${f.name} is huge. no limit, but stitching might hitch.`);
      next.push({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name });
    });
    setTiles((t) => [...t, ...next]);
  };

  const exportPng = async () => {
    if (!tiles.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = Math.max(1, cols);
    const size = 360;
    const rows = Math.ceil(tiles.length / c);
    canvas.width = c * size;
    canvas.height = rows * size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await Promise.all(
      tiles.map(
        (t, i) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const x = (i % c) * size;
              const y = Math.floor(i / c) * size;
              const scale = Math.max(size / img.width, size / img.height);
              const w = img.width * scale;
              const h = img.height * scale;
              ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = t.url;
          }),
      ),
    );
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mosaic.png';
    a.click();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">mosaic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">stitch local stills</h1>
          <p className="text-sm text-neutral-500 mb-8">not a vault. just drop images from your machine and export one quiet collage. stays on this device until you save it.</p>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <label className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">
              add stills
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            </label>
            <label className="text-xs text-neutral-500 flex items-center gap-2">
              columns
              <input type="range" min={2} max={6} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
              {cols}
            </label>
            <button onClick={exportPng} disabled={!tiles.length} className="px-5 py-2.5 rounded-full bg-white/5 text-sm disabled:opacity-40">export png</button>
            <button onClick={() => setTiles([])} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">clear</button>
          </div>
          {warn && <p className="text-xs text-amber-400/90 mb-4">{warn}</p>}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {tiles.map((t) => (
              <div key={t.id} className="aspect-square overflow-hidden rounded-2xl bg-white/5">
                <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </div>
    </div>
  );
}
