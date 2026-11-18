import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Annotation = { id: string; text: string; x: number; y: number; color: string };

export default function QuietAnnotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#FF453A');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setWarn('Please drop an image for annotation.');
      return;
    }
    setWarn(f.size > 40_000_000 ? 'Large image — may feel slower. No hard limits.' : null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAnnotations([]);
    setLink(null);
  }, []);

  useEffect(() => {
    if (!preview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const max = 640;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      annotations.forEach((a) => {
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillStyle = a.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(a.text, a.x, a.y);
        ctx.fillText(a.text, a.x, a.y);
      });
    };
    img.src = preview;
  }, [preview, annotations]);

  const placeAnnotation = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!text.trim() || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;
    setAnnotations((p) => [...p, { id: Math.random().toString(36).slice(2, 8), text: text.trim(), x, y, color }]);
    setText('');
  };

  const publish = async () => {
    if (!file || !canvasRef.current || busy) return;
    setBusy(true);
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setBusy(false);
        return;
      }
      const annotated = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-annotated.png', { type: 'image/png' });
      const res = await publishLocalFile(annotated, {
        caption: caption.trim() || 'annotated image',
        color: accent,
        cardTitle: annotated.name,
        meta: { desk: 'quietannotate', annotations: annotations.length },
      });
      setLink(res.embed || null);
      setBusy(false);
    }, 'image/png');
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Annotate</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Mark an image.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local image. Click to place quiet notes. The annotated version settles into the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style spring motion on frosted glass.
          </p>

          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-white/20');
                if (e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
            >
              <p className="text-neutral-300 text-[15px]">Drop an image here</p>
              <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="mb-6">
              <canvas
                ref={canvasRef}
                onClick={placeAnnotation}
                className="w-full rounded-2xl cursor-crosshair bg-black/40 border border-white/10"
              />
              <p className="text-xs text-neutral-500 mt-2 text-center">Click the image to place the current note</p>
            </div>
          )}

          <div className="flex gap-3 mb-5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Note to place"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0" />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the share"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {annotations.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl px-3 py-2 text-sm mb-2 flex justify-between items-center"
              >
                <span style={{ color: a.color }}>{a.text}</span>
                <button onClick={() => setAnnotations((p) => p.filter((x) => x.id !== a.id))} className="text-xs text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="block text-sm text-blue-400 truncate mb-4">{link}</a>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : 'Publish annotated image'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
