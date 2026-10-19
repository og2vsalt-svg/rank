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

export default function SoftlumenveilPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softlumenveil', desk: 'softlumenveil' },
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
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(''), 1400);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0"
            style={{
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 20px ${color}`,
              top: `${20 + i * 12}%`,
              opacity: 0.5,
            }}
            animate={{
              y: [0, -120, -140],
              opacity: [0, 0.8, 0],
              scaleX: [0.6, 1.2, 0.7],
            }}
            transition={{
              duration: 7 + i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softlumenveil</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">soft rising lumen veils</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Quiet horizontal veils of light that rise, breathe, and fade in your accent color. Multi-file drop with a shared note. Spring motion, glass surfaces, polished Discord embeds on every link. Each file lands in Supabase storage and the public_shares table. Large files warned for possible slowness, never refused. All prior desks stay fully functional. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-[28px] p-9 text-center transition hover:bg-white/[0.04]" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)); }}>
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/85">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files into the lumen veil'}</div>
          <div className="mt-1.5 text-[12px] text-white/40">any type · no hard limits · soft warning only</div>
        </label>

        {!!files.length && (
          <ul className="mt-4 space-y-1.5">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-4 py-2.5 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="shrink-0 text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every card" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none focus:ring-1 focus:ring-white/20" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for veils and embeds</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.018 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'veiling one by one…' : 'share into the lumen veil'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-7 space-y-2.5">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.name}</p>
                  {r.embed ? (
                    <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px] hover:bg-white/15">
                      {copied === r.embed ? 'copied' : 'copy link'}
                    </button>
                  ) : (
                    <span className="text-[12px] text-red-300">{r.error || 'failed'}</span>
                  )}
                </div>
                {r.embed && <p className="mt-1.5 break-all text-[12px] text-white/45">{r.embed}</p>}
                {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
