import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function MailslotPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [from, setFrom] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'this one is large. the tab may feel slow while it sends. nothing is refused.' : ''), [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn('');
    setLink('');
    const res = await publishLocalFile(file, {
      caption: note.trim() || undefined,
      author: from.trim() || undefined,
      cardTitle: file.name,
      color: '#0A84FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the slot did not take the file');
      return;
    }
    setWarn(res.warn || slow);
    setLink(shareUrls(res.id).app);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-24 px-5">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <p className="text-[13px] tracking-wide text-[#0a84ff] mb-2">mail slot</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">Post a file through the door.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-400">
            A local file lands in the share table, then you get a link that unfurls in Discord. This is a slot, not the vault. Older desks stay where they were.
          </p>
          <div className="mt-8 glass rounded-3xl p-5 sm:p-6">
            <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
              <input
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  setFile(next);
                  setLink('');
                  setErr('');
                }}
              />
              <span className="block text-sm text-white">{file ? file.name : 'choose a file from this device'}</span>
              <span className="block mt-1 text-xs text-neutral-500">{file ? formatBytes(file.size) : 'no size cap'}</span>
            </label>
            {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="from (optional)" className="mt-4 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the card" rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 resize-none" />
            <button onClick={send} disabled={!file || busy} className="mt-4 w-full py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
              {busy ? 'sending…' : 'post through the slot'}
            </button>
            {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
            {warn && <p className="mt-3 text-xs text-amber-200/80">{warn}</p>}
            {link && (
              <div className="mt-4 rounded-2xl bg-black/30 p-4">
                <p className="text-xs text-neutral-500 mb-2">discord will read this link as a card</p>
                <p className="text-sm text-white break-all">{link}</p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                  }}
                  className="mt-3 text-sm text-[#0a84ff]"
                >
                  {copied ? 'copied' : 'copy link'}
                </button>
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
