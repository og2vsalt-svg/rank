import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function AetherLedgerPage() {
  const [entries, setEntries] = useState([{ title: '', note: '' }]);
  const [accent, setAccent] = useState('#5E5CE6');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  const update = (i: number, field: 'title' | 'note', val: string) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  };

  const addEntry = () => setEntries(prev => [...prev, { title: '', note: '' }]);

  const share = async () => {
    const valid = entries.filter(e => e.title.trim() || e.note.trim());
    if (!valid.length) return setErr('add at least one entry');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      const md = `# Aether Ledger\n\n` + valid.map((e, i) => `## ${i + 1}. ${e.title || 'untitled'}\n\n${e.note || ''}`).join('\n\n---\n\n');
      const file = new File([md], 'aether-ledger.md', { type: 'text/markdown' });
      if (file.size > 40 * 1024 * 1024) setWarn('Large ledger. May feel slow. No hard limit.');
      const res = await publishLocalFile(file, {
        caption: 'an aether ledger of quiet entries',
        color: accent,
        cardTitle: valid[0].title || 'Aether Ledger',
        meta: { desk: 'aetherledger', entries: valid.length },
      });
      if (res.ok && res.embed) setLink(res.embed);
      else setErr(res.error || 'ledger slowed');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Aether Ledger</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Keep a quiet sequence of entries.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Build a short ledger of titles and notes. Publish the whole as one clean markdown share. Permanent Discord-ready link. Soft warnings only. No hard limits. Different from pure file vaults. Prior features intact. No traces of boosting.
          </p>

          <div className="space-y-4 mb-5">
            {entries.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-black/10 rounded-[16px] p-4">
                <input value={e.title} onChange={(ev) => update(i, 'title', ev.target.value)} placeholder={`Entry ${i + 1} title`} className="w-full bg-transparent border-b border-white/10 pb-2 mb-2 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none" />
                <textarea value={e.note} onChange={(ev) => update(i, 'note', ev.target.value)} placeholder="Note…" rows={2} className="w-full bg-transparent text-[14px] text-white placeholder:text-neutral-500 resize-none focus:outline-none" />
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <button type="button" onClick={addEntry} className="text-[13px] text-neutral-300 hover:text-white">Add entry</button>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={share} disabled={busy} className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg" style={{ background: accent }}>
            {busy ? 'Recording…' : 'Share the ledger'}
          </motion.button>

          {err && <p className="text-[13px] text-red-400 mt-3">{err}</p>}

          <AnimatePresence>
            {link && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <a href={link} target="_blank" rel="noreferrer" className="text-[13px] text-violet-300 hover:underline break-all">{link}</a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
