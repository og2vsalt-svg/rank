import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuoteCardPage() {
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quote, setQuote] = useState('The quieter you become, the more you can hear.');
  const [author, setAuthor] = useState('Rumi');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    draw();
  }, [quote, author, accent]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 800;
    canvas.height = 500;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // soft accent glow
    const g = ctx.createRadialGradient(400, 250, 0, 400, 250, 300);
    g.addColorStop(0, accent + '33');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f5f5f7';
    ctx.font = 'italic 28px -apple-system, Inter, sans-serif';
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, quote, 680);
    lines.forEach((line, i) => {
      ctx.fillText(line, 400, 180 + i * 40);
    });

    ctx.fillStyle = accent;
    ctx.font = '16px -apple-system, Inter, sans-serif';
    ctx.fillText('— ' + (author || 'anonymous'), 400, 380);
  };

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('could not capture');
      const file = new File([blob], 'quote-card.png', { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: quote.slice(0, 140),
        color: accent,
        cardTitle: 'quote card',
        meta: { desk: 'quotecard', kind: 'quote-card', author },
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
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Quote Card</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quiet card for words.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Type a quote and attribution. Preview the card, then publish it as a permanent share with polished Discord embeds. Soft warnings only. Apple-style springs.
          </p>

          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="the quote"
            rows={3}
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#AF52DE]/40 resize-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="attribution"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#AF52DE]/40"
          />
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-neutral-500">accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>

          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl border border-white/10 bg-black/40 mb-5"
          />

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !quote.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Sharing…' : 'Share quote card'}
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
