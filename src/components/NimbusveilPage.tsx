import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type Row = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
};

export default function NimbusveilPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => setRecent([]));
  }, []);

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
        meta: { accent: color, source: 'nimbusveil' },
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
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full glass"
            style={{
              left: `${8 + (i * 13) % 84}%`,
              top: `${12 + (i * 19) % 70}%`,
              width: 40 + (i % 5) * 12,
              height: 40 + (i % 5) * 12,
              background: `radial-gradient(circle at 30% 30%, ${color}66, transparent 70%)`,
              border: `1px solid ${color}33`,
              boxShadow: `0 0 40px ${color}22`,
            }}
            animate={{
              y: [0, -18, 0],
              x: [0, (i % 2 ? 8 : -8), 0],
              opacity: [0.45, 0.8, 0.45],
            }}
            transition={{
              duration: 4.5 + (i % 4) * 0.6,
              delay: i * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 24 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">nimbusveil</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">float what you carry behind a soft veil of glass</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Living nimbus of glass orbs that drift and breathe with spring motion. Drop local files with a shared note and accent. They enter storage and the public_shares table. Recent public drops settle into the veil. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
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
            <span className="text-[13px] text-white/50">accent for the drifting veil</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.015 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'sending one by one…' : 'lift into the nimbus'}
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

        {!!recent.length && (
          <div className="mt-10">
            <p className="text-[12px] uppercase tracking-[0.18em] text-white/40 mb-3">recent in the veil</p>
            <div className="grid gap-2.5">
              {recent.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">{s.name || s.caption || 'untitled'}</p>
                    <p className="text-[12px] text-white/40">{s.author || 'anonymous'} · {(s.size / 1024).toFixed(0)} kb</p>
                  </div>
                  <button onClick={() => copy(shareUrls(s.id).embed)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">
                    {copied === shareUrls(s.id).embed ? 'copied' : 'copy'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
