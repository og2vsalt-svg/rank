import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const PRISM = ['#0A84FF', '#64D2FF', '#AF52DE', '#FF9F0A', '#30D158', '#FF375F'];

export default function PrismCascadePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{ name: string; embed: string; color: string }[]>([]);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.filter((f) => f.size > 40 * 1024 * 1024).map((f) => `${f.name} is large — upload may feel slow. No hard limit.`);
    setWarns(big);
  };

  const cascade = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const next: { name: string; embed: string; color: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const color = PRISM[i % PRISM.length];
      try {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || title.trim() || 'from the prism cascade',
          color,
          cardTitle: title.trim() || f.name,
          meta: { desk: 'prismcascade', index: i },
        });
        if (res.ok && res.embed) next.push({ name: f.name, embed: res.embed, color });
        else setErr(res.error || 'one file slowed');
      } catch (e: any) {
        setErr(e.message || 'something slowed');
      }
    }
    setLinks(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1 text-[#64D2FF]">Prism Cascade</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Files rise in color.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop several local files. They cascade with sequential prism accents and Apple-style springs. Shared title and caption. Each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits. Prior desks stay untouched.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption for every link…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <label className="block mb-4 text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
            {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop local files'}
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>

          {warns.map((w, i) => (
            <p key={i} className="text-[12px] text-amber-300/90 mb-1">{w}</p>
          ))}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={cascade}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg bg-[#0A84FF]"
          >
            {busy ? 'Cascading…' : 'Cascade shares'}
          </motion.button>

          {err && <p className="mt-4 text-[12px] text-red-400">{err}</p>}

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l.embed}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                href={l.embed}
                className="block mt-4 text-[13px] break-all"
                style={{ color: l.color }}
              >
                {l.name} — {l.embed}
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
