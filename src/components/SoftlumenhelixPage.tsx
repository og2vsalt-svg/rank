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

export default function SoftlumenhelixPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
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
        meta: { accent: color, source: 'softlumenhelix', desk: 'softlumenhelix' },
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

  const coils = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      radius: 18 + i * 4,
      delay: i * 0.15,
      duration: 12 + i * 1.5,
    }));
  }, []);

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      {/* quiet helix */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {coils.map((c) => (
          <motion.div
            key={c.id}
            className="absolute rounded-full border"
            style={{
              width: `${c.radius * 2}%`,
              height: `${c.radius * 2}%`,
              borderColor: color,
              borderWidth: 1,
              opacity: 0.35,
              boxShadow: `0 0 20px ${color}22`,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1],
              opacity: [0.25, 0.5, 0.25],
            }}
            transition={{
              rotate: { duration: c.duration, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4 + c.id * 0.3, repeat: Infinity, ease: 'easeInOut', delay: c.delay },
              opacity: { duration: 4 + c.id * 0.3, repeat: Infinity, ease: 'easeInOut', delay: c.delay },
            }}
          />
        ))}
        <motion.div
          className="absolute h-3 w-3 rounded-full"
          style={{ background: color, boxShadow: `0 0 24px ${color}88` }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softlumenhelix</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet helix of shared light</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Soft spiraling coils that gently rotate and breathe in your accent, like quiet light winding through still space. Multi-file drop or quiet note. Files (or note-as-text) upload to storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center relative z-10">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'drop files into the helix or leave a note'}</div>
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
            <span className="text-[13px] text-white/50">accent for the helix</span>
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
          {busy ? 'settling the helix…' : 'share into the helix'}
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
