import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function NameplateDeskPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [style, setStyle] = useState<'minimal' | 'bold' | 'serif'>('minimal');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 420;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle glow
    const grad = ctx.createRadialGradient(450, 210, 40, 450, 210, 320);
    grad.addColorStop(0, color + '22');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontFamily = style === 'serif' ? 'Georgia, "Times New Roman", serif' : style === 'bold' ? 'system-ui, -apple-system, sans-serif' : 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const weight = style === 'bold' ? '700' : '500';

    ctx.fillStyle = '#ffffff';
    ctx.font = `${weight} 56px ${fontFamily}`;
    const main = title.trim() || 'Your name';
    ctx.fillText(main.slice(0, 32), canvas.width / 2, subtitle ? 180 : 210);

    if (subtitle.trim()) {
      ctx.fillStyle = color;
      ctx.font = `400 22px ${fontFamily}`;
      ctx.fillText(subtitle.trim().slice(0, 60), canvas.width / 2, 250);
    }

    // accent line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 40, subtitle ? 290 : 270);
    ctx.lineTo(canvas.width / 2 + 40, subtitle ? 290 : 270);
    ctx.stroke();
  };

  useEffect(() => {
    renderPreview();
  }, [title, subtitle, color, style]);

  const publish = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      renderPreview();
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('canvas unavailable');
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not render');
      const file = new File([blob], 'nameplate.png', { type: 'image/png' });
      setWarn(file.size > 40 * 1024 * 1024 ? 'Large render. Sending may feel slow. No hard limits.' : null);
      const res = await publishLocalFile(file, {
        caption: `${title.trim()}${subtitle ? ' · ' + subtitle.trim() : ''}`,
        color,
        cardTitle: title.trim() || 'nameplate',
        meta: { desk: 'nameplatedesk', kind: 'nameplate', style },
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
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 24 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Nameplate Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quiet title.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Type a name or title. Choose an accent and a quiet style. It becomes a sleek nameplate and a permanent share. Soft size warnings only. Polished Discord embeds on every link.
          </p>

          <div className="space-y-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="name or title"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
            />
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="optional subtitle"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-neutral-500">accent</span>
            </div>
            <div className="flex gap-1.5">
              {(['minimal', 'bold', 'serif'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-full text-xs transition ${
                    style === s ? 'bg-white/15 text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-black/30">
            <canvas
              ref={canvasRef}
              className="w-full block"
              style={{ imageRendering: 'auto' }}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !title.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share nameplate'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
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
