import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(bytes: number) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

export default function WaypostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{ app: string; discord: string } | null>(null);

  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'this drop is large. the tab may feel slow while it sends. nothing is refused.' : ''), [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(slow);
    try {
      const out = await publishLocalFile(file, { caption, author, cardTitle: file.name });
      if (!out.ok || !out.id) throw new Error(out.error || 'upload failed');
      const urls = shareUrls(out.id);
      const discord = `${window.location.origin}/waypost/${out.id}`;
      setLinks({ app: urls.app, discord });
      setWarn(out.warn || slow);
      try { await navigator.clipboard.writeText(discord); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not file this drop');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-7 sm:p-9"
        >
          <p className="text-[#0A84FF] text-sm mb-2">waypost</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Leave a file on the path.</h1>
          <p className="text-neutral-400 text-sm mt-3 mb-6">A local file is uploaded into the share store and written to the public shares table. No size cap. Discord gets a card on the waypost link.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center cursor-pointer hover:border-white/30">
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setLinks(null); }} />
            <span className="text-sm text-white">{file ? file.name : 'choose a file from this machine'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{pretty(file.size)} · {file.type || 'unknown type'}</span>}
          </label>
          {slow && <p className="text-xs text-amber-300/90 mt-3">{slow}</p>}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the card" className="w-full mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0A84FF]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full mt-3 mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0A84FF]/50" />
          <button onClick={send} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'sending…' : 'upload and share'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {warn && !err && <p className="text-xs text-neutral-500 mt-3">{warn}</p>}
          {links && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord: {links.discord}</p>
              <p>open: {links.app}</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
