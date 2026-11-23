import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function PolaroidDeskPage() {
  const { navigate } = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const size = file.size;
    setWarn(size > 8_000_000 ? 'Large image may feel slow to process. No hard limits.' : null);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generatePolaroid = async (): Promise<Blob | null> => {
    if (!image || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    img.src = image;
    await new Promise((resolve) => { img.onload = resolve; });

    const maxW = 600;
    const scale = Math.min(1, maxW / img.width);
    const w = img.width * scale;
    const h = img.height * scale;
    const border = 28;
    const bottom = 72;

    canvas.width = w + border * 2;
    canvas.height = h + border + bottom;

    // Polaroid white frame
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft shadow
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(border - 4, border - 4, w + 8, h + 8);
    ctx.shadowColor = 'transparent';

    // Image
    ctx.drawImage(img, border, border, w, h);

    // Caption
    if (caption.trim()) {
      ctx.fillStyle = '#1d1d1f';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(caption.slice(0, 48), canvas.width / 2, h + border + 42);
    }

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.92));
  };

  const publish = async () => {
    if (!image || busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generatePolaroid();
      if (!blob) throw new Error('Could not generate polaroid');
      const file = new File([blob], 'polaroid.png', { type: 'image/png' });
      const result = await publishLocalFile(file, {
        caption: caption || 'A quiet polaroid',
        color: '#FF2D55',
        cardTitle: caption.slice(0, 40) || 'Polaroid',
        meta: { desk: 'polaroid' },
      });
      if (result.ok && result.id) {
        setLink(shareUrls(result.id).app);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#FF2D55] mb-2">Polaroid</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Frame a moment.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a photo, add a short caption, and publish a classic polaroid with polished Discord embeds. Soft size warnings only.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-white/15 rounded-3xl py-12 text-center text-neutral-400 hover:border-white/30 hover:text-white transition mb-6"
          >
            {image ? 'Change photo' : 'Drop or choose a photo'}
          </button>

          {image && (
            <div className="mb-6">
              <img src={image} alt="preview" className="max-h-48 mx-auto rounded-2xl object-contain" />
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A quiet caption…"
            maxLength={48}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white mb-5 focus:outline-none focus:border-white/30"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !image}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF2D55]"
          >
            {busy ? 'Framing…' : 'Share polaroid'}
          </motion.button>

          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="mt-4 block text-sm text-[#FF2D55] underline"
            >
              {link}
            </button>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </div>
    </div>
  );
}
