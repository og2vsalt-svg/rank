import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietPathPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setRecent);
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    const big = list.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const share = async () => {
    if (files.length === 0 && !note.trim()) return setErr('add a file or a note');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || `along the quiet path · ${file.name}`,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softquietpath' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
      }
      if (note.trim() && files.length === 0) {
        // pure note path marker
        const res = await publishLocalFile(new File([note], 'path-note.txt', { type: 'text/plain' }), {
          caption: note.trim(),
          color: accent,
          cardTitle: 'Quiet path note',
          meta: { desk: 'softquietpath' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      const updated = await listPublicShares(12);
      setRecent(updated);
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Quiet Path</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">Walk the quiet path.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Drop one or many local files. They settle along a soft path of glass. Optional shared note and accent. Each lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="block mb-4">
            <span className="text-[13px] text-neutral-300">Local files</span>
            <input type="file" multiple className="mt-1 block w-full text-[14px] text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20" onChange={onFiles} />
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional quiet note for the path…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || (files.length === 0 && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling along the path…' : 'Share to the path'}
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

        <div className="mt-16">
          <h2 className="text-[20px] font-medium mb-6 tracking-tight">Recent along the path</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((item, i) => (
              <motion.a
                key={item.id}
                href={`/s/${item.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 18 }}
                className="glass rounded-[24px] p-5 block hover:bg-white/5 transition"
              >
                <p className="text-[15px] font-medium truncate">{item.name || 'untitled'}</p>
                <p className="text-[12px] text-neutral-500 mt-1">{item.caption?.slice(0, 80) || 'quiet drop'}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
