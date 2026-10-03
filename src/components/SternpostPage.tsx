import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SternpostPage() {
  const [file, setFile] = useState<File | null>(null);
  const [berth, setBerth] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a berth slip. the local file lands in the share table. the vault drawer is left alone.');
  const [card, setCard] = useState('');
  const [warn, setWarn] = useState('');

  const slow = useMemo(() => {
    if (!file || file.size < 8 * 1024 * 1024) return '';
    const mb = file.size / (1024 * 1024);
    const guess = Math.max(4, Math.round(mb / 1.5));
    return `${pretty(file.size)} can feel slow — about ${guess}s on a typical connection. still accepted.`;
  }, [file]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    setWarn(next && next.size > 8 * 1024 * 1024 ? 'heavy drop. the tab may pause while it writes. nothing is refused.' : '');
  }

  async function fileSlip() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('writing the slip…');
    try {
      const slip = [
        `# sternpost`,
        berth ? `berth: ${berth}` : 'berth: unnamed',
        when ? `when: ${when}` : '',
        note ? `note: ${note}` : '',
        `file: ${file.name}`,
        `size: ${pretty(file.size)}`,
      ].filter(Boolean).join('\n');
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('author', berth || 'sternpost');
      body.append('caption', slip.slice(0, 280));
      body.append('cardTitle', berth ? `${berth} — sternpost` : file.name);
      body.append('color', '#0A84FF');
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the share table did not take the file');
      const origin = window.location.origin;
      const link = `${origin}/s/${data.id}`;
      setCard(link);
      setStatus('filed. paste the link in Discord for the card.');
      if (data.warn) setWarn(String(data.warn));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file the slip');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium tracking-wide">sternpost</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-white">a berth for one file.</motion.h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">not a drawer. name the berth, pin a time, drop a local file. it lands in the share table and unfurls on Discord.</p>
        <div className="mt-8 space-y-3">
          <input value={berth} onChange={(e) => setBerth(e.target.value)} placeholder="berth name" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#0a84ff]/60" />
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="when — tuesday, after lunch" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#0a84ff]/60" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the card" rows={3} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#0a84ff]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white/80">{file ? file.name : 'choose a local file'}</span>
            {file && <span className="block mt-1 text-xs text-white/40">{pretty(file.size)}</span>}
          </label>
          {(warn || slow) && <p className="text-amber-200/90 text-sm">{warn || slow}</p>}
          <button onClick={fileSlip} disabled={!file || busy} className="w-full rounded-full bg-white text-black font-medium py-3 disabled:opacity-40 transition active:scale-[0.99]">
            {busy ? 'filing…' : 'file the slip'}
          </button>
          <p className="text-sm text-white/45">{status}</p>
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[#0a84ff] text-sm break-all">
              {card}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
