import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietLumenBoardPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const board = async () => {
    if (!files.length) return setErr('choose local files');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'pinned to the quiet board',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietlumenboard' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'pin failed');
      }
      setLinks(newLinks);
      setFiles([]);
      setCaption('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'board paused');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          className="glass rounded-[32px] p-8 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Lumen Board</p>
          <h1 className="text-[30px] font-semibold tracking-tight mb-3">A still board for shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Horizontal pins of public shares. Drop local files to pin them. Each settles into storage and public_shares. Professional Discord embeds on every link. Soft spring animations, glass. Large files warned of slowness, never refused. Prior features preserved. No traces of boosting.
          </p>

          <input type="file" multiple onChange={(e) => {
            const sel = Array.from(e.target.files || []);
            setFiles(sel);
            setWarn(sel.some(f => f.size > 40 * 1024 * 1024) ? 'Large files may feel slow to pin. No hard limit.' : null);
          }} className="mb-4 text-sm text-neutral-300" />

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Note for the board…"
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white mb-4 focus:outline-none"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full" />
            <span className="text-[13px] text-neutral-400">Accent</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={board}
            disabled={busy || !files.length}
            className="rounded-[18px] px-8 py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Pinning…' : 'Pin to board'}
          </motion.button>

          {links.map(l => <a key={l} href={l} className="block mt-3 text-[13px] break-all" style={{ color: accent }}>{l}</a>)}
          {err && <p className="mt-3 text-[12px] text-red-400">{err}</p>}
        </motion.div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 90, damping: 15 }}
              whileHover={{ y: -6 }}
              className="glass flex-shrink-0 w-64 rounded-[24px] p-5 shadow-md"
              style={{ borderTop: `3px solid ${s.color || accent}` }}
            >
              <p className="font-medium text-white text-[14px] mb-1 line-clamp-2">{s.name}</p>
              {s.caption && <p className="text-neutral-400 text-[12px] line-clamp-3">{s.caption}</p>}
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
