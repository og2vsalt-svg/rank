import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ShuttlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a local file goes to storage, then the share row.');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(8).then(setRecent).catch(() => setRecent([]));
  }, [card]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 12 * 1024 * 1024) setWarn('large drop. the tab may feel slow while it uploads. nothing is refused.');
    else setWarn('');
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    setStatus('sending the file...');
    const pub = await publishLocalFile(file, { caption, author, cardTitle: caption || file.name });
    setBusy(false);
    if (!pub.ok || !pub.id) {
      setStatus(pub.error || 'the row did not land');
      return;
    }
    setCard(pub.embed || shareUrls(pub.id).embed);
    setStatus(pub.warn || 'filed. paste the card link in Discord.');
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm">file desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">shuttle</motion.h1>
        <p className="mt-4 text-neutral-400 text-lg max-w-xl">carry a local file into the share table. not another drawer. Discord unfurls /shuttle and the card. large files are warned, never refused.</p>
        <motion.label initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center cursor-pointer hover:border-[#0a84ff]/40">
          <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <span className="text-neutral-200">{file ? file.name : 'choose a local file'}</span>
          {file && <span className="block mt-2 text-sm text-neutral-500">{pretty(file.size)}</span>}
        </motion.label>
        {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption" className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]/50" />
        </div>
        <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing' : 'file and share'}</button>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
        {card && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-neutral-500">Discord card</p>
            <a className="block mt-1 break-all text-[#0a84ff]" href={card}>{card}</a>
          </div>
        )}
        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm text-neutral-500 mb-3">recent public drops</h2>
            <ul className="space-y-2">
              {recent.map((row) => (
                <li key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex justify-between gap-4">
                  <a className="truncate hover:text-white" href={shareUrls(row.id).embed}>{row.name}</a>
                  <span className="text-neutral-500 text-sm shrink-0">{pretty(row.size || 0)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
