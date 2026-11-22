import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QRDeskPage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [size, setSize] = useState(300);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setQrUrl(null);
      return;
    }
    const encoded = encodeURIComponent(text.trim());
    const fg = accent.replace('#', '');
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&color=${fg}&bgcolor=ffffff`);
  }, [text, size, accent]);

  const publish = async () => {
    if (!qrUrl || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const resBlob = await (await fetch(qrUrl)).blob();
      const file = new File([resBlob], `qr-${Date.now()}.png`, { type: 'image/png' });
      const shareRes = await publishLocalFile(file, {
        caption: caption.trim() || text.trim() || 'QR share',
        color: accent,
        cardTitle: caption.trim() || 'QR code',
        meta: { desk: 'qrdesk', target: text.trim() },
      });
      if (shareRes.ok && shareRes.id) {
        setResult({ link: shareUrls(shareRes.id).app });
      } else {
        setResult({ error: shareRes.error });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>QR Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Make a link scannable.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Paste any share link or URL. Generate a real QR code, then publish it as a permanent file with a polished Discord embed. Soft size warnings only. Apple-style springs on frosted glass.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a rankvault share link or any URL…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the embed"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              size
              <input type="range" min={128} max={512} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-32" />
              <span className="text-white">{size}px</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              accent
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded" />
            </label>
          </div>

          {qrUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 mb-6"
            >
              <img src={qrUrl} alt="QR code" className="rounded-2xl border border-white/10 shadow-xl" />
              <motion.button
                whileTap={{ scale: 0.985 }}
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
            <div className="text-center">
              <p className="text-sm text-neutral-400 mb-2">live share</p>
              <button onClick={() => navigate('share', result.link!.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {result.link}
              </button>
            </div>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-2">{result.error}</p>}

          <p className="text-xs text-neutral-500 mt-6">
            QR codes use a public generation service. The published file lives in the database with full Discord embeds.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
