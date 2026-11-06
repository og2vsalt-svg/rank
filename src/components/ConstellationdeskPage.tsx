import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function ConstellationdeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [positions, setPositions] = useState<{x: number; y: number; name: string}[]>([]);

  useEffect(() => {
    listPublicShares(8).then(setRecent).catch(() => {});
  }, []);

  useEffect(() => {
    if (files.length === 0) {
      setPositions([]);
      return;
    }
    const next = files.map((f, i) => {
      const angle = (i / Math.max(files.length, 1)) * Math.PI * 2;
      const r = 80 + Math.random() * 40;
      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        name: f.name,
      };
    });
    setPositions(next);
  }, [files]);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the constellation may take a moment to settle. no hard limit.' : '');
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (files.length === 0) {
      setErr('drop at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'constellation node',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'constellationdesk', note: note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        made.push(shareUrls(res.id).app);
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.join('\n')); } catch {}
      }
      listPublicShares(8).then(setRecent).catch(() => {});
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>constellationdesk</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a living map of what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files. They arrange as floating nodes in a quiet constellation with spring motion. Shared note and accent tint every share. Links unfurl polished Discord cards. Large batches warned only for possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note for the constellation…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#5AC8FA]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#5AC8FA]/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files</p>
          </label>

          {positions.length > 0 && (
            <div className="relative h-48 mb-6 rounded-2xl bg-black/20 overflow-hidden">
              <AnimatePresence>
                {positions.map((p, i) => (
                  <motion.div
                    key={p.name + i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.05 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-lg"
                      style={{ background: accent, boxShadow: `0 0 12px ${accent}80` }}
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 whitespace-nowrap max-w-[80px] truncate">{p.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-1"
              >
                <span className="truncate max-w-[70%]">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3 mt-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition mt-2"
            style={{ background: accent }}
          >
            {busy ? 'settling stars…' : 'publish constellation'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (copied):</p>
              {links.map((l) => (
                <div key={l} className="break-all">{l}</div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 90, damping: 16 }}
            className="mt-8 glass rounded-[32px] p-6"
          >
            <p className="text-sm text-neutral-500 mb-4">recent public drops</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={shareUrls(r.id).app}
                  className="block rounded-2xl bg-white/5 p-3 hover:bg-white/10 transition text-xs text-neutral-300 truncate"
                >
                  {r.name || 'untitled'}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
