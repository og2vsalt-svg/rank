import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta, shareUrls } from '../lib/cloudShare';

export default function SignalPage() {
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    listPublicShares(16).then(setRecent).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const onFiles = useCallback((list: FileList | File[] | null) => {
    const f = list ? Array.from(list)[0] : null;
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large signal — the send may feel slow. No hard limits.' : null);
  }, []);

  const send = async () => {
    if (busy || (!note.trim() && !file)) {
      setErr('Write a note or drop a file to signal');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const caption = note.trim() || (file ? file.name : 'signal');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'signal', signal: true },
        });
      } else {
        const textFile = new File([note.trim()], 'signal.txt', { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: accent,
          cardTitle: 'signal',
          meta: { desk: 'signal', signal: true },
        });
      }
      if (!res.ok) {
        setErr(res.error || 'Signal failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setNote('');
      setFile(null);
      refresh();
      if (res.id) {
        try { await navigator.clipboard.writeText(shareUrls(res.id).app); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Signal</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Live signals.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A different desk. Compose a quick note or drop a local file. It joins the live feed of recent public shares. Every link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note with the signal…"
            rows={4}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-10 text-center mb-5 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Optional local file'}</p>
            <p className="text-neutral-500 text-sm mt-1">Drop or click</p>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={send}
            disabled={busy || (!note.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Signaling…' : 'Send signal'}
          </motion.button>
        </motion.div>

        <div>
          <p className="text-[13px] text-neutral-500 mb-4">live feed · refreshes every 8s</p>
          <div className="space-y-3">
            <AnimatePresence>
              {recent.map((r) => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  target="_blank"
                  rel="noreferrer"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium truncate">{r.name || r.cardTitle || 'signal'}</p>
                    <span className="text-[11px] text-neutral-500 shrink-0">{r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{r.caption || 'no note'} · {(r.size / 1024 / 1024).toFixed(1)} MB</p>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
