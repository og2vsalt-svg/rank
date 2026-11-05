import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

const ACCENTS = [
  { name: 'sky', value: '#5AC8FA' },
  { name: 'iris', value: '#AF52DE' },
  { name: 'blue', value: '#0A84FF' },
  { name: 'mint', value: '#30D158' },
  { name: 'amber', value: '#FF9F0A' },
  { name: 'rose', value: '#FF375F' },
];

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PrismdeskPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<CloudMeta | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const size = useMemo(() => file?.size || 0, [file]);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    // fetch specific if needed; for now recent covers it
  }, [shareId]);

  const onFile = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setErr('');
    setLink('');
    setWarn(next && next.size > 30 * 1024 * 1024 ? 'large prism drop. the tab may pause while it settles. nothing is refused.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: caption || undefined,
      author: author || undefined,
      color: accent,
      cardTitle: caption || file.name,
    });
    setBusy(false);
    if (!published.ok || !published.url) {
      setErr(published.error || 'could not settle the file');
      return;
    }
    setLink(published.embed || `${window.location.origin}/s/${published.id}`);
    setFile(null);
    setCaption('');
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl"
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-[100px] opacity-40"
            style={{ background: accent }}
          />
          <p className="text-[13px] tracking-[0.18em] uppercase text-white/40">glass prism</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Prismdesk</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            Drop a local file into the prism. Choose an accent. It settles into storage and the public_shares table with your color. Every share link unfurls a polished Discord card. Large drops warned, never refused. Spring motion, glass surfaces, human pacing.
          </p>

          <div className="mt-8 space-y-4">
            <label className="block text-sm text-white/70">
              file
              <input
                type="file"
                onChange={(e) => onFile(e.target.files)}
                className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
              />
            </label>
            {file && <p className="text-sm text-white/50">{file.name} · {pretty(size)}</p>}
            {warn && <p className="text-sm text-amber-200/80">{warn}</p>}

            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAccent(a.value)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform duration-200 ${accent === a.value ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ background: a.value }}
                  aria-label={a.name}
                />
              ))}
            </div>

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption (optional)"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#5AC8FA]"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name (optional)"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#5AC8FA]"
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!file || busy}
              onClick={send}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-100 disabled:opacity-40"
            >
              {busy ? 'settling…' : 'drop into prism'}
            </motion.button>
            {err && <p className="text-sm text-red-300">{err}</p>}
            {link && (
              <p className="text-sm text-white/70">
                share link <a className="text-[#5AC8FA]" href={link}>{link}</a>
              </p>
            )}
          </div>
        </motion.div>

        <section className="mt-10">
          <h2 className="text-lg font-medium">recent prism shares</h2>
          <ul className="mt-3 space-y-2">
            {recent.slice(0, 8).map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate('s', row.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
                >
                  <span>
                    <span className="block text-sm font-medium">{row.name}</span>
                    <span className="text-xs text-white/45">{pretty(row.size)} · {row.author || 'anonymous'}</span>
                  </span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: row.color || accent }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
