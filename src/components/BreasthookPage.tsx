import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BreasthookPage() {
  const [problem, setProblem] = useState('');
  const [change, setChange] = useState('');
  const [proof, setProof] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a three-line brief. optional local file. both can land in the share table.');
  const [card, setCard] = useState('');

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > 8 * 1024 * 1024 ? 'this attachment is heavy. the write can feel slow. it is still accepted.' : '');
  }

  async function publish() {
    if (busy) return;
    if (!problem.trim() && !file) {
      setStatus('write a problem, or attach a file.');
      return;
    }
    setBusy(true);
    setStatus('filing the brief…');
    try {
      const md = [`# breasthook`, '', `problem: ${problem || '—'}`, `change: ${change || '—'}`, `proof: ${proof || '—'}`, file ? `attachment: ${file.name} (${pretty(file.size)})` : ''].filter(Boolean).join('\n');
      const blob = new Blob([md], { type: 'text/markdown' });
      const body = new FormData();
      body.append('file', blob, 'breasthook.md');
      body.append('caption', (problem || 'breasthook brief').slice(0, 280));
      body.append('cardTitle', 'breasthook');
      body.append('author', 'breasthook');
      body.append('color', '#AF52DE');
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the share table did not take the brief');
      let extra = '';
      if (file) {
        const fb = new FormData();
        fb.append('file', file, file.name);
        fb.append('caption', `attachment for ${data.id}`);
        fb.append('cardTitle', file.name);
        fb.append('author', 'breasthook');
        const fr = await fetch('/api/share', { method: 'POST', body: fb });
        const fd = await fr.json();
        if (!fr.ok) throw new Error(fd.error || 'attachment was not filed');
        extra = `\n${window.location.origin}/s/${fd.id}`;
        if (fd.warn) setWarn(String(fd.warn));
      }
      const link = `${window.location.origin}/s/${data.id}`;
      setCard(link + extra);
      setStatus('filed. the brief link unfurls in Discord.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file the brief');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#af52de] text-sm font-medium tracking-wide">breasthook</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-white">problem, change, proof.</motion.h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">a short brief, not a vault. the markdown lands in the share table. an optional local file rides along as its own card.</p>
        <div className="mt-8 space-y-3">
          <input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="problem" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#af52de]/60" />
          <input value={change} onChange={(e) => setChange(e.target.value)} placeholder="change" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#af52de]/60" />
          <textarea value={proof} onChange={(e) => setProof(e.target.value)} placeholder="proof" rows={3} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#af52de]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white/80">{file ? file.name : 'optional local attachment'}</span>
            {file && <span className="block mt-1 text-xs text-white/40">{pretty(file.size)}</span>}
          </label>
          {warn && <p className="text-amber-200/90 text-sm">{warn}</p>}
          <button onClick={publish} disabled={busy} className="w-full rounded-full bg-white text-black font-medium py-3 disabled:opacity-40 transition active:scale-[0.99]">
            {busy ? 'filing…' : 'file the brief'}
          </button>
          <p className="text-sm text-white/45">{status}</p>
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[#af52de] text-sm whitespace-pre-wrap break-all">
              {card}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
