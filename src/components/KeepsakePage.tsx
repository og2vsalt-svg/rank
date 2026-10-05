import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { prettySize } from '../lib/db';

export default function KeepsakePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{ embed: string; file: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setErr('');
    setLinks(null);
    const slow = file.size > 12 * 1024 * 1024 ? 'this one is heavy. the tab may feel slow while it sends. nothing is refused.' : '';
    setWarn(slow);
    const res = await publishLocalFile(file, { caption, author, cardTitle: file.name });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take the file');
      return;
    }
    const urls = shareUrls(res.id);
    setLinks({ embed: urls.embed, file: res.url || urls.file });
    if (res.warn) setWarn(res.warn);
  }

  async function copy() {
    if (!links) return;
    await navigator.clipboard.writeText(links.embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-[#30d158]">keepsake</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-3 text-4xl font-semibold tracking-tight">hand a local file to the table</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">The file leaves this computer and lands in the shared shelf table. There is no size gate. A large drop only warns that the send may feel slow. Paste the card link in Discord.</p>
        <form onSubmit={send} className="mt-8 glass rounded-[28px] p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer hover:-translate-y-0.5">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="block text-sm">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'any type'}</span>
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a line for the card" className="mt-4 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30d158]/50" />
          {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
          <button disabled={busy || !file} className="mt-4 rounded-full bg-[#30d158] text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'sending…' : 'share the file'}</button>
        </form>
        {links && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs uppercase tracking-widest text-neutral-500">filed</p>
            <p className="mt-2 text-sm break-all text-[#64b5ff]">{links.embed}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={copy} className="rounded-full bg-white text-black px-4 py-2 text-xs font-medium">{copied ? 'copied' : 'copy discord link'}</button>
              <a href={links.file} className="rounded-full border border-white/10 px-4 py-2 text-xs">open file</a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
