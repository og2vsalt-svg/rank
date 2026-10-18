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

const trees = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  left: 8 + i * 12,
  delay: i * 0.3,
  height: 120 + (i % 3) * 40,
}));

export default function SoftgrovePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#34D399');
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
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softgrove' },
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

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 bottom-0">
        {trees.map((t) => (
          <motion.div
            key={t.id}
            className="absolute bottom-0 w-3 rounded-t-full blur-md mix-blend-screen"
            style={{
              left: `${t.left}%`,
              height: t.height,
              background: color,
              opacity: 0.25,
            }}
            animate={{
              height: [t.height, t.height * 1.2, t.height],
              opacity: [0.2, 0.4, 0.22],
            }}
            transition={{
              duration: 5 + t.id * 0.5,
              delay: t.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 24 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softgrove</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">soft grove of light</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Quiet trees of light that grow and breathe with your accent. Multi-file drop with a shared note, spring-loaded glass, and professional Discord embeds on every share. Files land in storage and the public_shares table. Large batches only warned for possible slowness. No hard limits. Prior desks preserved. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-[28px] p-9 text-center transition hover:bg-white/[0.03]">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'choose files from this machine'}</div>
          <div className="mt-1.5 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
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
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every card" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for grove and cards</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.015 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'sending one by one…' : 'share the grove'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-7 space-y-2.5">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3.5">
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
