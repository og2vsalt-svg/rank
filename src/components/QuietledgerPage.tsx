import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietledgerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [entry, setEntry] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 45 * 1024 * 1024) ? 'large attachment. the send may feel slower. never refused.' : '');
  };

  const publish = async () => {
    if (!entry.trim() && !files.length) return setErr('write an entry or attach a file');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    if (files.length) {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: entry || 'quiet ledger entry',
          cardTitle: file.name,
          meta: { desk: 'quietledger', hasEntry: !!entry.trim() },
        });
        if (res.ok && res.id) created.push(shareUrls(res.id).app);
        else setErr(res.error || 'issue with a file');
      }
    } else {
      // pure note share via a tiny placeholder if needed — fall back to caption-only by publishing a text blob
      const blob = new Blob([entry], { type: 'text/plain' });
      const file = new File([blob], 'ledger.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: entry,
        cardTitle: 'quiet ledger',
        meta: { desk: 'quietledger', noteOnly: true },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'could not file the entry');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 105, damping: 19 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">quietledger</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">write first. attach if you wish.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            A longer entry that travels with optional files. Soft spring animations, glass surfaces, polished Discord embeds on every link. Everything lands in the database. Large files warned, never refused.
          </p>
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="write the ledger entry…"
            rows={6}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/40 transition-all resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-6 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} attachment${files.length > 1 ? 's' : ''}` : 'optional files (or leave empty for note only)'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || (!entry.trim() && !files.length)}
            className="w-full mt-4 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'filing…' : 'file the entry'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all space-y-1">
              {links.map((l, i) => <div key={i}>filed: {l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
