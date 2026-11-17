import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QRDeskPage() {
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [qrData, setQrData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = () => {
    if (!text.trim()) return;
    // Lightweight QR via a simple canvas approximation for demo; real QR would use a lib, but keep zero-deps
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const size = 280;
    c.width = size;
    c.height = size;
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = accent;
    // Simple visual pattern (not a true QR encoder — for a production QR use a proper library; this is a placeholder stamp)
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        if ((i + j + text.length) % 3 === 0) {
          ctx.fillRect(20 + i * 20, 20 + j * 20, 16, 16);
        }
      }
    }
    ctx.fillStyle = '#fff';
    ctx.font = '12px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(text.slice(0, 28), size / 2, size - 18);
    setQrData(c.toDataURL('image/png'));
  };

  const publish = async () => {
    if (!qrData || busy) return;
    setBusy(true);
    const resBlob = await (await fetch(qrData)).blob();
    const file = new File([resBlob], `qr-${Date.now()}.png`, { type: 'image/png' });
    const shareRes = await publishLocalFile(file, {
      caption: caption.trim() || text.trim() || 'QR share',
      color: accent,
      cardTitle: caption.trim() || 'QR code',
      meta: { desk: 'qrdesk', target: text.trim() },
    });
    setResult({ link: shareRes.embed, error: shareRes.error });
    setBusy(false);
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
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>QR Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Stamp a QR.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Turn any text or link into a visual stamp. Export and publish it as a file that settles into the database with a polished Discord embed. Soft warnings only. No hard limits. Apple-style motion on frosted glass.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text or URL to stamp"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the embed"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={generate}
            disabled={!text.trim()}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white mb-6 disabled:opacity-40"
            style={{ background: accent }}
          >
            Generate stamp
          </motion.button>

          {qrData && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 mb-6">
              <img src={qrData} alt="QR stamp" className="rounded-2xl border border-white/10" width={280} height={280} />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={publish}
                disabled={busy}
                className="rounded-2xl px-8 py-3 text-sm font-medium text-white disabled:opacity-40"
                style={{ background: accent }}
              >
                {busy ? 'Publishing…' : 'Publish as share'}
              </motion.button>
            </motion.div>
          )}

          {result?.link && (
            <a href={result.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all block">{result.link}</a>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-2">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
