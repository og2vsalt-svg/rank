import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenVaultPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => {});
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    if (list.length) setFiles((p) => [...list, ...p].slice(0, 12));
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setFiles((p) => [...list, ...p].slice(0, 12));
  };

  const share = async () => {
    if (!files.length) return;
    setBusy(true);
    setMsg('');
    const next: typeof results = [];
    for (const file of files) {
      const warn = file.size > 40 * 1024 * 1024 ? 'large file — may feel slow while uploading. no hard limit.' : null;
      const res = await publishLocalFile(file, { caption: note || undefined, color: accent, author: 'rankvault' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, embed: res.embed, name: file.name, warn: res.warn || warn });
      } else {
        setMsg(res.error || 'upload failed');
      }
    }
    setResults((p) => [...next, ...p]);
    setFiles([]);
    setBusy(false);
    if (next.length) listPublicShares(12).then(setRecent).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-[#0a84ff] text-sm tracking-wide mb-1">softlumenvault</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet vault of shared light.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop local files. they land in storage and the public record. share links carry polished discord embeds. soft spring motion. large files receive only a gentle warning of slowness. no hard limits.</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center mb-6 cursor-pointer hover:bg-white/[0.04] transition"
            onClick={() => document.getElementById('vault-pick')?.click()}
          >
            <input id="vault-pick" type="file" multiple className="hidden" onChange={onPick} />
            <p className="text-neutral-300 text-sm">drop files here or click to choose</p>
            <p className="text-xs text-neutral-500 mt-1">up to a dozen at once · any size</p>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2 mb-6">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-2xl px-4 py-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-neutral-500 text-xs">{(f.size / 1024 / 1024).toFixed(1)} mb</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3 mb-6">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="shared note (optional)"
              className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-white/20"
            />
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-10 rounded-2xl bg-transparent border border-white/10 cursor-pointer"
            />
          </div>

          <button
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-2xl bg-white text-black font-medium py-3 text-sm disabled:opacity-40 transition active:scale-[0.98]"
          >
            {busy ? 'sending…' : 'share to the vault'}
          </button>
          {msg && <p className="text-amber-300/80 text-xs mt-3">{msg}</p>}
        </motion.div>

        <AnimatePresence>
          {results.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="glass rounded-3xl p-5 mb-3"
              style={{ borderColor: accent + '33' }}
            >
              <p className="text-sm font-medium truncate">{r.name}</p>
              <a href={r.embed} className="text-[#0a84ff] text-xs break-all hover:underline">{r.embed}</a>
              {r.warn && <p className="text-xs text-amber-300/70 mt-1">{r.warn}</p>}
            </motion.div>
          ))}
        </AnimatePresence>

        {recent.length > 0 && (
          <div className="mt-10">
            <p className="text-neutral-500 text-xs mb-3 uppercase tracking-wider">recent light</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.map((s) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
                >
                  <p className="text-sm truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{s.caption || 'shared light'}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
