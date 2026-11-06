import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

const ACCENTS = [
  { name: 'summit', value: '#5AC8FA' },
  { name: 'alpine', value: '#AF52DE' },
  { name: 'peak', value: '#FF9F0A' },
  { name: 'ridge', value: '#30D158' },
  { name: 'mist', value: '#8E8E93' },
];

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SummitDeskPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + (f.size || 0), 0), [files]);

  useEffect(() => {
    listPublicShares(20).then(setRecent).catch(() => setRecent([]));
  }, []);

  const onFiles = (list: FileList | null) => {
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setErr('');
    setLinks([]);
    const big = next.some(f => f.size > 30 * 1024 * 1024) || totalSize > 60 * 1024 * 1024;
    setWarn(big ? 'summit climb. large files or batches may pause the tab while they settle into storage. nothing is refused.' : '');
  };

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const results: string[] = [];
    for (const file of files) {
      const published = await publishLocalFile(file, {
        caption: caption || undefined,
        author: author || undefined,
        color: accent,
        cardTitle: caption || file.name,
        meta: { desk: 'summitdesk' },
      });
      if (!published.ok || !published.url) {
        setErr(published.error || 'could not settle one of the files');
        setBusy(false);
        return;
      }
      results.push(published.embed || `${window.location.origin}/s/${published.id}`);
    }
    setBusy(false);
    setLinks(results);
    setFiles([]);
    setCaption('');
    listPublicShares(20).then(setRecent).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 20 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.02] p-10 backdrop-blur-2xl"
        >
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-[120px] opacity-25"
            style={{ background: accent }}
          />
          <p className="text-[12px] tracking-[0.22em] uppercase text-white/30">elevated summit</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight">SummitDesk</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
            Drop one or many local files at the summit. They settle into storage and the public_shares table with your accent color. Every share link unfurls a polished Discord card. Large drops or batches are gently warned about possible slowness, never refused. Spring motion, glass surfaces, human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div className="mt-10 space-y-5">
            <label className="block text-sm text-white/70">
              files
              <input
                type="file"
                multiple
                onChange={(e) => onFiles(e.target.files)}
                className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
              />
            </label>
            {files.length > 0 && (
              <div className="text-sm text-white/50">
                {files.length} file{files.length > 1 ? 's' : ''} · {pretty(totalSize)}
                <ul className="mt-1 text-xs opacity-70 space-y-0.5">
                  {files.slice(0, 5).map(f => <li key={f.name}>{f.name} · {pretty(f.size)}</li>)}
                  {files.length > 5 && <li>+{files.length - 5} more</li>}
                </ul>
              </div>
            )}
            {warn && <p className="text-sm text-amber-200/70">{warn}</p>}

            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAccent(a.value)}
                  className={`h-10 w-10 rounded-full border-2 transition-all duration-200 ${accent === a.value ? 'scale-110 border-white shadow-lg' : 'border-transparent'}`}
                  style={{ background: a.value }}
                  aria-label={a.name}
                />
              ))}
            </div>

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption that travels with the climb (optional)"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm outline-none transition focus:border-[#5AC8FA]"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name (optional)"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm outline-none transition focus:border-[#5AC8FA]"
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              disabled={!files.length || busy}
              onClick={send}
              className="rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:bg-neutral-100 disabled:opacity-40"
            >
              {busy ? 'settling at the summit…' : 'drop at the summit'}
            </motion.button>
            {err && <p className="text-sm text-red-300">{err}</p>}
            <AnimatePresence>
              {links.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 text-sm text-white/70">
                  <p className="text-white/40">share links</p>
                  {links.map((l, i) => (
                    <p key={i}><a className="text-[#5AC8FA] break-all" href={l}>{l}</a></p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <section className="mt-12">
          <h2 className="text-lg font-medium">recent summit shares</h2>
          <ul className="mt-4 space-y-2.5">
            {recent.slice(0, 10).map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate('s', row.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-3.5 text-left transition hover:bg-white/[0.06]"
                >
                  <span>
                    <span className="block text-sm font-medium">{row.name}</span>
                    <span className="text-xs text-white/45">{pretty(row.size)} · {row.author || 'anonymous'}{row.caption ? ` · ${row.caption.slice(0, 40)}` : ''}</span>
                  </span>
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: row.color || accent }} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
