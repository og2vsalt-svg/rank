import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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

export default function SoftlumenwellPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length && !caption) return;
    setBusy(true);
    const next: Row[] = [];
    const toShare = files.length ? files : [new File([caption], 'note.txt', { type: 'text/plain' })];
    for (const file of toShare) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softlumenwell', desk: 'softlumenwell' },
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
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  const ripples = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      delay: i * 0.8,
      duration: 6 + i * 0.4,
    }));
  }, []);

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      {/* quiet well ripples */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="absolute rounded-full border"
            style={{
              borderColor: color,
              borderWidth: 1.5,
              opacity: 0.4,
              boxShadow: `0 0 40px ${color}33`,
            }}
            initial={{ width: '10%', height: '10%', opacity: 0.6 }}
            animate={{
              width: ['10%', '140%'],
              height: ['10%', '140%'],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: r.duration,
              repeat: Infinity,
              ease: 'easeOut',
              delay: r.delay,
            }}
          />
        ))}
        <motion.div
          className="absolute h-4 w-4 rounded-full"
          style={{ background: color, boxShadow: `0 0 32px ${color}aa` }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softlumenwell</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet well of shared light</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Soft ripples that gently expand and fade in your accent, like stones finding still water. Multi-file drop or quiet note. Files (or note-as-text) upload to storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center relative z-10">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'drop files into the well or leave a note'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
        </label>

        {!!files.length && (
          <ul className="mt-4 space-y-1.5 relative z-10">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="shrink-0 text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid gap-3 relative z-10">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="quiet note that rides every card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for the well</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80 relative z-10">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={send}
          disabled={(!files.length && !caption) || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40 relative z-10"
          style={{ background: color }}
        >
          {busy ? 'settling the well…' : 'share into the well'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-6 space-y-2 relative z-10">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.name}</p>
                  {r.embed ? (
                    <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">
                      {copied === r.embed ? 'copied' : 'copy /s'}
                    </button>
                  ) : (
                    <span className="text-[12px] text-red-300">{r.error || 'failed'}</span>
                  )}
                </div>
                {r.embed && <p className="mt-1 break-all text-[12px] text-white/45">{r.embed}</p>}
                {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
