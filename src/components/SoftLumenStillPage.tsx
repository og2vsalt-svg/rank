import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares } from '../lib/cloudShare';

type Recent = { id: string; name: string; caption: string | null; createdAt?: string };

export default function SoftLumenStillPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#A8E6CF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const shares = await listPublicShares(8);
        setRecent(shares);
      } catch {}
    })();
  }, []);

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning of slowness.'
        : '',
    );
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file into the still field');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'soft lumen still drop',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'softlumenstill', accent, stillNote: note.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        newLinks.push(shareUrls(res.id).app);
      }
      setLinks(newLinks);
      try {
        await navigator.clipboard.writeText(newLinks.join('\n'));
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 85, damping: 17 }}
          className="glass rounded-[40px] p-8 relative overflow-hidden"
        >
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[130%] h-56 rounded-full blur-3xl pointer-events-none opacity-15"
            style={{ background: accent }}
          />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            softlumenstill
          </p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet still field of shared light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or more local files into the still field. Soft cards settle into the field in your color, like light resting on still ground. Each file uploads to storage and the public_shares table with your shared note and accent. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note that rests with every file in the still field"
            rows={3}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready to settle`
                : 'drop or click for one or more files'}
            </p>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-1 text-xs text-neutral-400"
              >
                {files.map((f, i) => (
                  <li key={i} className="truncate">
                    {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'let them rest'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-xs text-neutral-400 space-y-1"
            >
              <p>copied share links:</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">
                  {l}
                </p>
              ))}
            </motion.div>
          )}
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent stills</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((r, idx) => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx, type: 'spring', stiffness: 75, damping: 15 }}
                  className="glass rounded-2xl p-4 block hover:scale-[1.02] transition-transform"
                >
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>
                  )}
                  {r.createdAt && (
                    <p className="text-[10px] text-neutral-600 mt-2">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
