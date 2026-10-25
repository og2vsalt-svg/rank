import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares } from '../lib/cloudShare';

type Share = {
  id: string;
  name: string;
  size: number;
  caption?: string | null;
  color?: string | null;
  createdAt?: string;
  downloads?: number;
  url?: string;
  mime?: string;
};

function prettySize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

function prettyDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function SoftLumenNotePage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#A78BFA');
  const [caption, setCaption] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(36);
      setShares(
        s.map((m: any) => ({
          id: m.id,
          name: m.name || 'untitled',
          size: m.size || 0,
          caption: m.caption,
          color: m.color,
          createdAt: m.createdAt,
          downloads: m.downloads,
          url: m.url,
          mime: m.type,
        }))
      );
    } catch {
      // quiet fail
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const big = arr.find((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const dropFiles = async () => {
    if (!files.length) return setErr('choose at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const made: string[] = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'softlumennote' },
        });
        if (res.ok && res.embed) made.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      setLinks(made);
      setFiles([]);
      setCaption('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const dropNote = async () => {
    const body = noteBody.trim();
    if (!body) return setErr('write a short note first');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const name = `note-${Date.now().toString(36)}.txt`;
      const file = new File([body], name, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: caption.trim() || body.slice(0, 140),
        color: accent,
        cardTitle: 'quiet note',
        meta: { desk: 'softlumennote', kind: 'note' },
      });
      if (res.ok && res.embed) {
        setLinks([res.embed]);
        setNoteBody('');
        setCaption('');
        await load();
      } else if (!res.ok) setErr(res.error || 'note slowed');
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[28px] p-8 mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>
            Soft Lumen Note
          </p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A quiet vertical thread of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Leave a short note or drop local files into a still timeline. Each settles into storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass, human pacing. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>

          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Write a quiet note…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[14px] text-white placeholder:text-neutral-500 mb-3 resize-none focus:outline-none focus:border-white/20"
          />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional shared caption for files or notes…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[14px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-5">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border-0"
            />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Or choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.015 }}
              onClick={dropNote}
              disabled={busy || !noteBody.trim()}
              className="px-6 rounded-[18px] py-3 text-[14px] font-medium text-white disabled:opacity-40 transition"
              style={{ background: accent }}
            >
              {busy ? 'Settling note…' : 'Leave note'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.015 }}
              onClick={dropFiles}
              disabled={busy || !files.length}
              className="px-6 rounded-[18px] py-3 text-[14px] font-medium text-white disabled:opacity-40 transition border border-white/15"
              style={{ background: 'transparent', color: accent }}
            >
              {busy ? 'Placing files…' : 'Place files'}
            </motion.button>
          </div>

          <AnimatePresence>
            {links.map((l) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={l}
                className="block mt-4 text-[13px] break-all"
                style={{ color: accent }}
              >
                {l}
              </motion.a>
            ))}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[12px] text-red-400">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-6">
            {shares.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), type: 'spring', stiffness: 110, damping: 20 }}
                className="relative pl-12"
              >
                <div
                  className="absolute left-[10px] top-4 w-4 h-4 rounded-full border-2"
                  style={{ borderColor: s.color || accent, background: 'rgba(11,11,13,0.9)' }}
                />
                <motion.a
                  href={`/s/${s.id}`}
                  whileHover={{ y: -2 }}
                  className="glass rounded-[22px] p-5 block hover:bg-white/[0.05] transition"
                  style={{ borderLeft: `3px solid ${s.color || accent}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-neutral-100 truncate">{s.name}</p>
                      {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-3">{s.caption}</p>}
                    </div>
                    {s.mime?.startsWith('image/') && s.url && (
                      <img
                        src={s.url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-500">
                    <span>{prettyDate(s.createdAt)}</span>
                    <span>
                      {prettySize(s.size)} · {s.downloads || 0} arrivals
                    </span>
                  </div>
                </motion.a>
              </motion.div>
            ))}
          </div>
          {!shares.length && (
            <p className="text-center text-neutral-500 text-sm mt-8 pl-12">The timeline is still empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}
