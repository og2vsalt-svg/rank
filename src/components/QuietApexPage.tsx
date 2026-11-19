import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function QuietApexPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const shared = await publishLocalFile(file, {
        author: 'apex',
        caption: note.trim() || undefined,
        cardTitle: (note.trim() || file.name).slice(0, 80),
        color: '#BF5AF2',
        meta: { desk: 'quietapex' },
      });
      if (!shared.ok || !shared.id) throw new Error(shared.error || 'the apex did not hold');
      if (shared.warn) setWarn(shared.warn);
      const url = shareUrls(shared.id).embed;
      setLink(url);
      try { await navigator.clipboard.writeText(url); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, #BF5AF244, transparent 70%)' }} />
          </div>
          <p className="text-[#BF5AF2] text-sm mb-2 relative z-10">quiet apex</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative z-10">the high still point.</h1>
          <p className="text-neutral-400 text-sm mb-6 relative z-10">drop one local file. soft radial glow settles over frosted glass. it publishes to the database with a polished Discord embed on the link. soft size warnings only. no hard limits. Apple-style springs.</p>

          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#BF5AF2]/40 p-10 text-center mb-5 transition-colors duration-300 relative z-10">
            <input type="file" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setWarn(f && f.size > 40 * 1024 * 1024 ? 'a heavy apex. the send may feel slow. nothing is refused.' : '');
            }} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'drop a local file'}</span>
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="optional quiet note"
            className="w-full mb-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#BF5AF2]/40 transition-colors relative z-10"
          />

          {warn && <p className="text-xs text-amber-300/80 mb-3 relative z-10">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3 relative z-10">{err}</p>}

          <button
            onClick={publish}
            disabled={busy || !file}
            className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform relative z-10"
          >
            {busy ? 'rising to the apex…' : 'publish'}
          </button>

          {link && <p className="text-xs text-neutral-500 mt-4 break-all relative z-10">Discord link copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
