import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Overlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

export default function QuietPalimpsestPage() {
  const { navigate } = useRouter();
  const [bg, setBg] = useState<File | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState('#F5F5F7');
  const [size, setSize] = useState(28);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (bgUrl) URL.revokeObjectURL(bgUrl);
    };
  }, [bgUrl]);

  const onBg = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setWarn('please drop an image for the base layer');
      return;
    }
    setWarn(file.size > 40 * 1024 * 1024 ? 'large image. rendering may feel slow. no hard limit.' : null);
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    setBg(file);
    setBgUrl(URL.createObjectURL(file));
    setOverlays([]);
    setResult(null);
    setStatus('idle');
  }, [bgUrl]);

  const addOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draft.trim() || !bgUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOverlays(prev => [
      ...prev,
      { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: draft.trim(), x, y, color, size },
    ]);
    setDraft('');
  };

  const removeOverlay = (id: string) => setOverlays(o => o.filter(x => x.id !== id));

  const publish = async () => {
    if (!bg || !canvasRef.current || !imgRef.current) return;
    setStatus('uploading');
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStatus('idle');
      return;
    }
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 800;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    overlays.forEach(o => {
      ctx.font = `${o.size}px Inter, -apple-system, sans-serif`;
      ctx.fillStyle = o.color;
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      const px = (o.x / 100) * canvas.width;
      const py = (o.y / 100) * canvas.height;
      ctx.fillText(o.text, px, py);
    });
    ctx.shadowBlur = 0;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setStatus('idle');
        return;
      }
      const file = new File([blob], `palimpsest-${Date.now()}.png`, { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: 'composed on quiet palimpsest',
        color,
        cardTitle: 'Quiet Palimpsest',
        author: 'rankvault',
        meta: { desk: 'quietpalimpsest', layers: overlays.length },
      });
      if (res.ok && res.id) {
        setResult({ id: res.id, embed: shareUrls(res.id).embed });
        listPublicShares(6).then(setRecent).catch(() => {});
      }
      setStatus('done');
    }, 'image/png', 0.92);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
        >
          <div className="absolute left-1/3 top-1/3 w-[700px] h-[400px] rounded-full blur-[140px] bg-[#0A84FF]/10" />
          <div className="absolute right-1/4 bottom-1/4 w-80 h-80 rounded-full blur-[100px] bg-[#AF52DE]/8" />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
          >
            quiet palimpsest
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-neutral-400 mb-10 max-w-2xl text-lg leading-relaxed"
          >
            Layer quiet notes over a local image. Drop a base photo, click to place text, then publish the composed image to the database. Soft size warnings only. No hard limits. Every share unfurls a polished Discord embed. Human-crafted Apple-style spring motion on frosted glass.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onBg(f); }}
                className="block rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md p-8 text-center cursor-pointer hover:border-white/30 transition-all duration-300"
              >
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onBg(e.target.files[0])} />
                <div className="text-base font-medium mb-1">drop a base image</div>
                <div className="text-xs text-neutral-500">or click · soft size warnings only</div>
                {warn && <div className="mt-3 text-amber-300/90 text-xs">{warn}</div>}
              </label>

              {bgUrl && (
                <div className="mt-6 relative rounded-3xl overflow-hidden border border-white/10 bg-black/20" style={{ aspectRatio: '4/3' }}>
                  <img ref={imgRef} src={bgUrl} alt="base" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0" onClick={addOverlay}>
                    <AnimatePresence>
                      {overlays.map(o => (
                        <motion.div
                          key={o.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: 'absolute',
                            left: `${o.x}%`,
                            top: `${o.y}%`,
                            color: o.color,
                            fontSize: `${o.size * 0.4}px`,
                            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                            pointerEvents: 'auto',
                            transform: 'translate(-10%, -50%)',
                            maxWidth: '70%',
                            lineHeight: 1.2,
                          }}
                          className="font-medium cursor-pointer hover:opacity-70"
                          onClick={e => { e.stopPropagation(); removeOverlay(o.id); }}
                          title="click to remove"
                        >
                          {o.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="type a note, then click the image to place it"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">text color</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                  <label className="text-sm text-neutral-400 ml-4">size</label>
                  <input type="range" min={16} max={72} value={size} onChange={e => setSize(Number(e.target.value))} className="flex-1" />
                </div>
                <motion.button
                  onClick={publish}
                  disabled={!bg || status === 'uploading'}
                  whileTap={{ scale: 0.985 }}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3.5 disabled:opacity-40 transition hover:bg-neutral-100"
                >
                  {status === 'uploading' ? 'composing…' : 'publish composition'}
                </motion.button>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10"
                  >
                    <div className="font-medium text-sm mb-2">shared</div>
                    <a href={result.embed} className="text-sm text-blue-400 truncate hover:text-blue-300" target="_blank" rel="noreferrer">
                      {result.embed}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div>
              <h2 className="text-lg font-medium mb-5 text-neutral-200">recent compositions</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.015, x: 3 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition border border-white/5"
                  >
                    <div className="font-medium truncate text-sm">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.caption || 'shared from rankvault'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public shares yet</div>}
              </div>
              <div className="mt-12 text-sm text-neutral-500">
                click an overlay to remove it. the published file is a flattened PNG with your layers baked in.
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button onClick={() => navigate('directory')} className="text-sm text-neutral-400 hover:text-white transition">
              browse all desks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
