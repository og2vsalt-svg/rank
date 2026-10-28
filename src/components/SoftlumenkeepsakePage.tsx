import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SoftlumenkeepsakePage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<CloudMeta | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const size = useMemo(() => file?.size || 0, [file]);

  const load = () => {
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    // For keepsake we use public shares; fetch via list or direct if needed
    listPublicShares(50).then((all) => {
      const found = all.find((m) => m.id === shareId);
      setOpen(found || null);
    }).catch(() => setOpen(null));
  }, [shareId]);

  const onFile = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setErr('');
    setLink('');
    setWarn(next && next.size > 30 * 1024 * 1024 ? 'large keepsake. the tab may pause while it sends. nothing is refused.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: note || undefined,
      cardTitle: title || file.name,
      color: accent,
      meta: { desk: 'softlumenkeepsake', accent },
    });
    setBusy(false);
    if (!published.ok || !published.url) {
      setErr(published.error || 'could not store the keepsake');
      return;
    }
    setLink(`${window.location.origin}/softlumenkeepsake/${published.id}`);
    setFile(null);
    setTitle('');
    setNote('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] relative overflow-hidden">
      <Navbar />
      {/* soft floating light orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-30"
            style={{
              background: accent,
              width: 120 + i * 40,
              height: 120 + i * 40,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <main className="relative mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">keepsake</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Soft Lumen Keepsake</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A quiet place for one file and a note that stays with it. Soft light orbs drift in your accent. The file lands in storage, a row in public_shares. Share the link for a polished Discord card. Large files receive only a gentle warning of slowness.</p>

        <AnimatePresence>
          {open && (
            <motion.section
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">keepsake</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.cardTitle || open.name}</h2>
              {open.caption && <p className="mt-3 text-[15px] leading-relaxed text-white/80">{open.caption}</p>}
              <a href={open.url} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02]">{open.name} · {pretty(open.size)}</a>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <label className="block text-sm text-white/70">
            file
            <input type="file" onChange={(e) => onFile(e.target.files)} className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white" />
          </label>
          {file && <p className="mt-2 text-sm text-white/50">{file.name} · {pretty(size)}</p>}
          {warn && <p className="mt-2 text-sm text-amber-200/80">{warn}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="keepsake title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 cursor-pointer" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a quiet note that stays with the file" rows={3} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff] resize-none" />
          <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'placing…' : 'place the keepsake'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm text-white/70">share link <a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">recent keepsakes</h2>
          <ul className="mt-3 space-y-2">
            {recent.slice(0, 6).map((row) => (
              <li key={row.id}>
                <button onClick={() => navigate('softlumenkeepsake', row.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]">
                  <span>
                    <span className="block text-sm font-medium">{row.cardTitle || row.name}</span>
                    <span className="text-xs text-white/45">{pretty(row.size)}</span>
                  </span>
                  <span className="text-xs text-white/40">open</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
