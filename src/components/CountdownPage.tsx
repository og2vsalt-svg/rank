import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CountdownPage() {
  const { navigate } = useRouter();
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState('');

  const onFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40_000_000 ? 'Large files may take a moment. No hard limits.' : null);
  };

  const publish = async () => {
    if (!target || busy) return;
    const dt = new Date(target);
    if (isNaN(dt.getTime()) || dt.getTime() < Date.now()) {
      setError('choose a future moment');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const caption = message.trim() || 'a quiet countdown';
      const blob = new Blob([JSON.stringify({ countdown: target, message: caption }, null, 2)], { type: 'application/json' });
      const toShare = file || new File([blob], 'countdown.json', { type: 'application/json' });
      const res = await publishLocalFile(toShare, {
        caption,
        color: '#AF52DE',
        cardTitle: caption.slice(0, 60),
        meta: { desk: 'countdown', countdown: target, message: caption },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not publish');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
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
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Countdown</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A future moment.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Set a quiet time ahead. Add a note. Optionally attach an image. Share a living countdown with polished Discord embeds. Soft size warnings only.
          </p>

          <label className="block text-xs text-neutral-500 mb-1.5">when</label>
          <input
            type="datetime-local"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional quiet note"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onClick={() => document.getElementById('cd-file')?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-8 text-center mb-5 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? <img src={preview} alt="" className="max-h-40 mx-auto rounded-xl" /> : <p className="text-neutral-400 text-sm">optional image</p>}
            <input id="cd-file" type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}
          {error && <p className="text-[13px] text-red-400 mb-5">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !target}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Sharing…' : 'Share countdown'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#AF52DE] text-sm">{link}</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
