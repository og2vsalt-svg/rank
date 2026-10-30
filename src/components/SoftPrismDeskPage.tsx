import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Row = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
};

export default function SoftPrismDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 45 * 1024 * 1024, [files]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption ? `${caption} · ${file.name}` : (title || file.name),
        color: accent,
        cardTitle: title || file.name,
        meta: { desk: 'softprismdesk', accent },
      });
      next.push({
        name: file.name,
        size: file.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
      setRows([...next]);
    }
    setBusy(false);
    setFiles([]);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20"
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${accent} 50%, transparent 60%)`,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          }}
          animate={{ rotate: [0, 12, -8, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softprismdesk</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-tight text-white">Light refracts across what you carry.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Drop one or many local files with a shared title and caption. A soft rotating prism refracts your accent color across frosted glass with spring motion. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-10 block cursor-pointer rounded-[28px] p-10 text-center border border-white/10 hover:border-white/20 transition">
          <input className="hidden" type="file" multiple onChange={(e) => onFiles(e.target.files)} />
          <div className="text-[16px] text-white/85">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · soft warning only · no hard limits</div>
        </label>

        {!!files.length && (
          <ul className="mt-4 space-y-1.5">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="shrink-0 text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional title" className="glass rounded-[18px] px-4 py-3 text-[14px] outline-none" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="optional caption" className="glass rounded-[18px] px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for prism and cards</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-40 shadow-lg"
          style={{ background: accent }}
        >
          {busy ? 'refracting…' : 'share under the prism'}
        </motion.button>

        <AnimatePresence>
          {!!rows.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-2">
              {rows.map((r) => (
                <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[14px]">{r.name}</p>
                    {r.embed ? (
                      <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">
                        {copied === r.embed ? 'copied' : 'copy link'}
                      </button>
                    ) : (
                      <span className="text-[12px] text-red-300">{r.error || 'failed'}</span>
                    )}
                  </div>
                  {r.embed && <p className="mt-1 break-all text-[12px] text-white/45">{r.embed}</p>}
                  {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
