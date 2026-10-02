import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function StrakePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const slow = useMemo(() => {
    if (!file) return null;
    return file.size > 12 * 1024 * 1024
      ? 'a heavy file. the tab may feel slow while it sends. nothing is refused.'
      : null;
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      cardTitle: cardTitle.trim() || file.name,
      color,
      author: 'strake',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take that file');
      return;
    }
    setEmbed(shareUrls(res.id).embed);
    setWarn(res.warn || slow);
  };

  const copy = async () => {
    if (!embed) return;
    await navigator.clipboard.writeText(embed);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">share desk</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">strake</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            One local file, one row in the share database. The link you copy is the Discord card. No size cutoff — only a note if the send will feel slow.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 sm:p-6"
        >
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer">
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                setEmbed('');
                if (next && !cardTitle) setCardTitle(next.name);
              }}
            />
            <span className="text-sm text-neutral-200">{file ? file.name : 'choose a local file'}</span>
            <span className="block mt-1 text-xs text-white/40">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · lands in public_shares` : 'bytes go to storage, the row goes to the table'}
            </span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          <input
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="card title"
            className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="line Discord should show under the title"
            rows={3}
            className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-300">
            <span>accent</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border border-white/10" />
            <span className="text-white/40">{color}</span>
          </label>
          <button
            onClick={send}
            disabled={!file || busy}
            className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending' : 'file and share'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>

        {embed && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={copy}
            className="glass mt-4 w-full text-left rounded-3xl px-5 py-4"
          >
            <span className="block text-sm text-white">{copied ? 'copied' : 'discord card'}</span>
            <span className="block mt-1 text-xs text-white/50 break-all">{embed}</span>
            {warn && <span className="block mt-2 text-xs text-amber-200/80">{warn}</span>}
          </motion.button>
        )}
      </main>
    </div>
  );
}
