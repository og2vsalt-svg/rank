import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Step = { id: string; text: string; done: boolean };
type Check = {
  id: string;
  title: string;
  steps: Step[];
  note?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FairleadPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a checklist, not a drawer.');
  const [card, setCard] = useState('');
  const [checks, setChecks] = useState<Check[]>([]);
  const [open, setOpen] = useState<Check | null>(null);

  async function load() {
    const r = await fetch('/api/fairlead');
    const data = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(data.checks)) setChecks(data.checks);
  }

  useEffect(() => {
    load().catch(() => setStatus('the checklist shelf is quiet right now.'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/fairlead?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((row) => {
        if (row && row.id) setOpen(row);
      })
      .catch(() => {});
  }, [shareId]);

  function addStep() {
    const text = draft.trim();
    if (!text) return;
    setSteps((prev) => [...prev, { id: Math.random().toString(36).slice(2, 8), text, done: false }]);
    setDraft('');
  }

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > 12 * 1024 * 1024 ? 'this file is heavy. the send can feel slow. it is still accepted.' : '');
  }

  async function toggle(stepId: string) {
    if (!open) return;
    const next = open.steps.map((step) => (step.id === stepId ? { ...step, done: !step.done } : step));
    setOpen({ ...open, steps: next });
    await fetch('/api/fairlead', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: open.id, steps: next }),
    }).catch(() => setStatus('the tick did not land. try again.'));
  }

  async function publish() {
    if (busy) return;
    if (!title.trim() || !steps.length) {
      setStatus('name the list and add a step.');
      return;
    }
    setBusy(true);
    setStatus(file ? 'filing the proof, then the list…' : 'writing the list…');
    try {
      let share = '';
      let fileName = '';
      if (file) {
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('caption', (note || title).slice(0, 280));
        body.append('cardTitle', title.trim());
        body.append('author', 'fairlead');
        body.append('color', '#64D2FF');
        const fr = await fetch('/api/share', { method: 'POST', body });
        const fd = await fr.json();
        if (!fr.ok) throw new Error(fd.error || 'the share table did not take the file');
        share = fd.id;
        fileName = file.name;
        if (fd.warn) setWarn(String(fd.warn));
      }
      const r = await fetch('/api/fairlead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), note: note.trim(), steps, shareId: share, fileName }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the list was not written');
      const origin = window.location.origin;
      const lines = [`${origin}/fairlead/${data.id}`];
      if (share) lines.push(`${origin}/s/${share}`);
      setCard(lines.join('\n'));
      setStatus('filed. paste either link in Discord for a card.');
      setTitle('');
      setNote('');
      setSteps([]);
      setFile(null);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not write the list');
    } finally {
      setBusy(false);
    }
  }

  const shown = open;
  const doneCount = shown ? shown.steps.filter((step) => step.done).length : 0;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#64d2ff] text-sm font-medium tracking-wide">fairlead</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-white">a list, not a cabinet.</motion.h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">steps live on their own shelf. a proof file from this machine is optional, and still lands in the share table. both links unfurl on Discord. large files are warned, never refused.</p>
        {shown && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-white/[0.05] border border-white/10 px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-white font-medium">{shown.title}</p>
              <span className="text-xs text-white/40">{doneCount}/{shown.steps.length}</span>
            </div>
            {shown.note && <p className="mt-1 text-sm text-white/55">{shown.note}</p>}
            <div className="mt-3 space-y-1.5">
              {shown.steps.map((step) => (
                <button key={step.id} onClick={() => toggle(step.id)} className="w-full text-left flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/5 transition">
                  <span className={`w-4 h-4 rounded-full border ${step.done ? 'bg-[#64d2ff] border-[#64d2ff]' : 'border-white/30'}`} />
                  <span className={step.done ? 'text-white/40 line-through' : 'text-white/85'}>{step.text}</span>
                </button>
              ))}
            </div>
            {shown.share_id && (
              <a href={`/s/${shown.share_id}`} className="mt-3 inline-block text-sm text-[#64d2ff]">{shown.file_name || 'open the filed proof'}</a>
            )}
          </motion.div>
        )}
        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this list is for" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#64d2ff]/60 transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line of context" rows={2} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#64d2ff]/60 transition" />
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }} placeholder="add a step" className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#64d2ff]/60 transition" />
            <button onClick={addStep} className="rounded-full px-4 bg-white/10 text-white text-sm">add</button>
          </div>
          {steps.length > 0 && (
            <ul className="space-y-1">
              {steps.map((step) => (
                <li key={step.id} className="text-sm text-white/70 px-1">{step.text}</li>
              ))}
            </ul>
          )}
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white/80">{file ? file.name : 'optional proof file'}</span>
            {file && <span className="block mt-1 text-xs text-white/40">{pretty(file.size)}</span>}
          </label>
          {warn && <p className="text-amber-200/90 text-sm">{warn}</p>}
          <button onClick={publish} disabled={busy} className="w-full rounded-full bg-white text-black font-medium py-3 disabled:opacity-40 transition active:scale-[0.99]">
            {busy ? 'writing…' : 'file the list'}
          </button>
          <p className="text-sm text-white/45">{status}</p>
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[#64d2ff] text-sm whitespace-pre-wrap break-all">
              {card}
            </button>
          )}
        </div>
        <div className="mt-10 space-y-2">
          {checks.map((check) => (
            <motion.button
              key={check.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/fairlead/${check.id}`)}
              className="w-full text-left rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 hover:bg-white/[0.07] transition"
            >
              <span className="block text-white">{check.title}</span>
              <span className="block mt-1 text-xs text-white/40">{Array.isArray(check.steps) ? check.steps.length : 0} steps{check.file_name ? ` · ${check.file_name}` : ''}</span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
