import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function FidPage() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [label, setLabel] = useState('splice');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const send = async () => {
    if (!left.trim() && !right.trim()) return;
    setBusy(true);
    setError('');
    const text = `# ${label.trim() || 'splice'}\n\n## one\n${left.trim()}\n\n## two\n${right.trim()}\n`;
    const file = new File([text], `${(label.trim() || 'splice').replace(/[^\w.-]+/g, '-')}.md`, { type: 'text/markdown' });
    if (file.size > 2 * 1024 * 1024) setWarn('heavy splice. sending may feel slow. it is not refused.');
    const res = await publishLocalFile(file, { caption: label.trim().slice(0, 140) || 'a splice from fid', color: '#BF5AF2' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the splice did not hold');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">fid</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">splice two drafts</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Two texts stay in the tab until you file them as one markdown drop. Discord unfurls the card. This is a desk, not the vault.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="name of the splice" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <textarea value={left} onChange={(e) => setLeft(e.target.value)} placeholder="first draft" rows={9} className="w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
            <textarea value={right} onChange={(e) => setRight(e.target.value)} placeholder="second draft" rows={9} className="w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          </div>
          <button onClick={send} disabled={busy || (!left.trim() && !right.trim())} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'splicing…' : 'file the splice'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
