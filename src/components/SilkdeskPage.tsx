import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

const HUES = [
  { name: 'pearl', value: '#f5f5f7' },
  { name: 'mist', value: '#a8c0d4' },
  { name: 'blush', value: '#f4c2c2' },
  { name: 'sage', value: '#b8d4b8' },
  { name: 'dusk', value: '#c9b8d4' },
  { name: 'sand', value: '#e8d5b5' },
];

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SilkdeskPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [hue, setHue] = useState(HUES[1].value);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [query, setQuery] = useState('');

  const size = useMemo(() => file?.size || 0, [file]);

  useEffect(() => {
    listPublicShares(16).then(setRecent).catch(() => setRecent([]));
  }, []);

  const onFile = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setErr('');
    setLink('');
    setWarn(next && next.size > 25 * 1024 * 1024 ? 'a generous drop. the silk may take a moment to settle. nothing is turned away.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: caption || undefined,
      author: author || undefined,
      color: hue,
      cardTitle: caption || file.name,
    });
    setBusy(false);
    if (!published.ok || !published.url) {
      setErr(published.error || 'the silk could not hold this one');
      return;
    }
    setLink(published.embed || `${window.location.origin}/s/${published.id}`);
    setFile(null);
    setCaption('');
    listPublicShares(16).then(setRecent).catch(() => {});
  };

  const filtered = recent.filter(r =>
    !query || r.name.toLowerCase().includes(query.toLowerCase()) || (r.caption || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.025] p-8 backdrop-blur-2xl"
        >
          <div
            className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full blur-[120px] opacity-30"
            style={{ background: hue }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -right-16 h-72 w-72 rounded-full blur-[110px] opacity-20"
            style={{ background: '#ffffff' }}
          />
          <p className="text-[13px] tracking-[0.2em] uppercase text-white/35">soft silk</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Silkdesk</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
            Lay a local file on the silk. Choose a quiet hue. It settles into storage and the public_shares table with your color. Every share link opens a polished Discord card. Large drops are warned, never refused. Spring motion, soft glass, human pacing.
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
            {warn && <p className="text-sm text-amber-200/75">{warn}</p>}

            <div className="flex flex-wrap gap-2">
              {HUES.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHue(h.value)}
                  className={`h-10 w-10 rounded-full border-2 transition-all duration-200 ${hue === h.value ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-80'}`}
                  style={{ background: h.value }}
                  aria-label={h.name}
                />
              ))}
            </div>

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="whisper (optional caption)"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition focus:border-white/30"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name (optional)"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition focus:border-white/30"
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!file || busy}
              onClick={send}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-100 disabled:opacity-40"
            >
              {busy ? 'settling on silk…' : 'lay on silk'}
            </motion.button>
            {err && <p className="text-sm text-red-300">{err}</p>}
            {link && (
              <p className="text-sm text-white/70">
                share link <a className="underline decoration-white/30" href={link}>{link}</a>
              </p>
            )}
          </div>
        </motion.div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">recent silk shares</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search"
              className="w-40 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-sm outline-none"
            />
          </div>
          <ul className="mt-3 space-y-2">
            {filtered.slice(0, 10).map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate('s', row.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-left transition hover:bg-white/[0.05]"
                >
                  <span>
                    <span className="block text-sm font-medium">{row.name}</span>
                    <span className="text-xs text-white/45">{pretty(row.size)} · {row.author || 'anonymous'}{row.caption ? ` · ${row.caption.slice(0, 40)}` : ''}</span>
                  </span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: row.color || hue }}
                  />
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-sm text-white/40">nothing matches yet</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
