import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietSignalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [signal, setSignal] = useState('');
  const [accent, setAccent] = useState('#FF375F');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const send = async () => {
    if (!file && !signal.trim()) return setErr('send a file or a signal');
    setBusy(true);
    setErr('');
    setLink(null);
    setPulse(p => p + 1);
    try {
      if (file) {
        const res = await publishLocalFile(file, {
          caption: signal.trim() || 'a quiet signal',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietsignal', pulse },
        });
        if (res.ok && res.embed) {
          setLink(res.embed);
          setFile(null);
          setSignal('');
          setWarn(null);
        } else {
          setErr(res.error || 'signal faded');
        }
      }
    } catch (e: any) {
      setErr(e.message || 'the beacon is quiet');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0a0508]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-xl mx-auto relative">
        <motion.div
          key={pulse}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)` }}
          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[30px] p-8 shadow-2xl relative z-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Signal</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white mb-3">Send a soft pulse.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop a local file or write a brief signal. Soft pulsing beacon animations with Apple springs. Uploads to the public shares database. Every link gets a professional Discord embed. Soft size warnings only — no hard limits. All prior features remain. No traces of boosting.
          </p>

          <input
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
            placeholder="Optional signal text…"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white">
              {file ? file.name : 'Attach local file'}
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setWarn(f && f.size > 45 * 1024 * 1024 ? 'Large signal. May transmit slowly. No hard limit.' : null);
              }} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={send}
            disabled={busy || (!file && !signal.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Pulsing…' : 'Send signal'}
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
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
