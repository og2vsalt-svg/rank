import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietQRPage() {
  const [data, setData] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [qrUrl, setQrUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (!data.trim()) {
      setQrUrl('');
      return;
    }
    const encoded = encodeURIComponent(data.trim().slice(0, 800));
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}&color=0A84FF&bgcolor=050506`);
  }, [data]);

  const share = async () => {
    if (!data.trim()) return setErr('enter a URL or text');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const res = await fetch(qrUrl);
      if (!res.ok) throw new Error('could not generate qr');
      const blob = await res.blob();
      const file = new File([blob], 'quiet-qr.png', { type: 'image/png' });
      const published = await publishLocalFile(file, {
        caption: data.trim().slice(0, 180),
        color: accent,
        cardTitle: 'Quiet QR',
        meta: { desk: 'quietqr', source: data.trim().slice(0, 500) },
      });
      if (published.ok && published.embed) setLink(published.embed);
      else setErr(published.error || 'share failed');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 21 }}
          className="glass rounded-[32px] p-8 shadow-2xl text-center"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet QR</p>
          <h1 className="text-[30px] font-semibold tracking-tight mb-3">Turn a link into a quiet code.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-7">
            Enter any URL or short text. A clean QR appears. Publish it to the database and receive a polished Discord embed link. Soft warnings only. No hard limits. Prior features remain.
          </p>

          <input
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="https://… or any text"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center justify-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          <AnimatePresence mode="wait">
            {qrUrl ? (
              <motion.div
                key={qrUrl}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                className="inline-block glass rounded-[24px] p-5 mb-6"
              >
                <img src={qrUrl} alt="QR preview" width={220} height={220} className="rounded-2xl" />
              </motion.div>
            ) : (
              <div className="h-[260px] grid place-items-center text-neutral-500 text-sm mb-6">QR will appear here</div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !data.trim()}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : 'Share QR'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-5 text-[13px] break-all"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
