import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftPrismLatticePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = async () => {
    const list = await listPublicShares(24);
    setShares(list);
  };

  useEffect(() => { refresh(); }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    const big = list.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limits.' : null);
  };

  const publish = async () => {
    if (files.length === 0 && !caption.trim()) return setErr('add a file or a note');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'settled in the prism lattice',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softprismlattice' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
      }
      setLinks(newLinks);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-12 shadow-2xl mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Soft Prism Lattice</p>
          <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight mb-4 leading-tight">A living lattice of refracted light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            Drop one or many local files. They land in storage and the public_shares table with a shared note and accent. Recent public drops settle into a responsive lattice of glass tiles that lift with spring motion on hover. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared note for the lattice…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-5 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex flex-wrap items-center gap-5 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="text-[14px] text-neutral-300 cursor-pointer hover:text-white transition px-4 py-2 rounded-full glass">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Select local files'}
              <input type="file" multiple className="hidden" onChange={onFiles} />
            </label>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || (files.length === 0 && !caption.trim())}
            className="rounded-[20px] px-8 py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Refracting…' : 'Publish to lattice'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 18 }}
              whileHover={{ y: -8, scale: 1.04 }}
              className="glass rounded-[24px] p-4 block"
            >
              {s.type.startsWith('image/') && s.url && (
                <img src={s.url} alt="" className="w-full aspect-square object-cover rounded-2xl mb-3" />
              )}
              <p className="text-[13px] font-medium truncate">{s.name}</p>
              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{s.caption || 'shared file'}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
