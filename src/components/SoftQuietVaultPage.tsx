import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftQuietVaultPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.filter((f) => f.size > 40 * 1024 * 1024);
    setWarns(big.length ? [`${big.length} file${big.length > 1 ? 's' : ''} may feel slow to send. No hard limits.`] : []);
  };

  const share = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const out: string[] = [];
    try {
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'softquietvault' },
        });
        if (res.ok && res.embed) out.push(res.embed);
        else setErr(res.error || 'one file slowed');
      }
      setLinks(out);
      setFiles([]);
      setCaption('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-10 shadow-2xl border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: accent }}>
            Soft Quiet Vault
          </p>
          <h1 className="text-[34px] font-semibold tracking-tight leading-tight mb-3 text-white">
            Drop files. Share quietly.
          </h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Multi-file local upload. Each file lands in storage and the public_shares table. Shared caption and accent. Every link unfurls a polished Discord embed. Soft spring motion on frosted glass. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="block mb-6">
            <div className="border-2 border-dashed border-white/10 rounded-[24px] p-10 text-center cursor-pointer hover:border-white/20 transition-all duration-300 bg-white/[0.02]">
              <p className="text-neutral-300 text-[15px] mb-1">
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or click to add local files'}
              </p>
              <p className="text-[12px] text-neutral-500">No size limits. Soft warning only if large.</p>
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </div>
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional shared caption…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[20px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-5 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border border-white/10"
            />
            <span className="text-[13px] text-neutral-400">Accent for the embeds</span>
          </div>

          {warns.map((w, i) => (
            <p key={i} className="text-[12px] text-amber-300/90 mb-3">{w}</p>
          ))}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the vault…' : 'Share to vault'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 space-y-3"
              >
                {links.map((l) => (
                  <motion.a
                    key={l}
                    href={l}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="block text-[13px] break-all hover:underline"
                    style={{ color: accent }}
                  >
                    {l}
                  </motion.a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-[13px] text-red-400">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
