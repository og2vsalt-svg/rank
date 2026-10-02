import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function SheerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? 'large drop. the tab may feel slow while it sends. nothing is refused.' : null), [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(null);
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: title.trim() || file.name,
      color,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take that file');
      return;
    }
    setId(res.id);
    setWarn(res.warn || slow);
  };

  const urls = id ? shareUrls(id) : null;

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial="hidden" animate="show" variants={rise}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">file desk</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">sheer</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A local file lands in the share database. The Discord card is the /s link. No size cap — only a warning if the browser will feel it.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 sm:p-6"
        >
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer lift">
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setId('');
              }}
            />
            <span className="text-sm text-neutral-200">{file ? file.name : 'choose a local file'}</span>
            <span className="block mt-1 text-xs text-white/40">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${file.type || 'unknown type'}` : 'any type, any size'}
            </span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="author" className="rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          </div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the Discord card" rows={3} className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="card accent" className="h-10 w-14 rounded-xl bg-transparent border border-white/10" />
            <span className="text-xs text-white/45">accent on the card</span>
          </div>
          <button onClick={send} disabled={!file || busy} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file to the share table'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
        </motion.section>

        {urls && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mt-4 rounded-3xl p-5">
            <p className="text-sm text-neutral-200">filed. paste the Discord link — bots get the card.</p>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => copy('discord', urls.embed)} className="w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10">{copied === 'discord' ? 'copied' : urls.embed}</button>
              <button onClick={() => copy('open', urls.open)} className="w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10">{copied === 'open' ? 'copied' : urls.open}</button>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
