import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { getSatchel, prettySize, saveSatchel, toggleSatchelStep, uploadShare } from '../lib/db';

type Step = { id: string; label: string; done: boolean };

export default function SatchelPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [draft, setDraft] = useState('open the file\nreply when it lands');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<any>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'this file is large. the tab may feel slow while it uploads. nothing is refused.';
    if (file.size > 20 * 1024 * 1024) return 'over 20 MB. it will go through, just leave the tab open.';
    return '';
  }, [file]);

  useEffect(() => {
    if (!shareId) return;
    getSatchel(shareId).then(setRow).catch(() => setRow(null));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const share = await uploadShare(file, note.trim(), author.trim());
      const steps: Step[] = draft
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 12)
        .map((label, i) => ({ id: String(i + 1), label, done: false }));
      const saved = await saveSatchel({
        shareId: share.id,
        title: title.trim() || file.name,
        note: note.trim(),
        author: author.trim(),
        steps,
        fileName: file.name,
        fileUrl: share.file_url,
        mime: file.type,
        size: file.size,
      });
      const url = `${window.location.origin}/satchel/${saved.id}`;
      setLink(url);
      setRow(saved);
      history.pushState(null, '', `/satchel/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 240) : 'could not pack the satchel');
    } finally {
      setBusy(false);
    }
  }

  async function flip(stepId: string) {
    if (!row) return;
    const next = (row.steps || []).map((s: Step) => (s.id === stepId ? { ...s, done: !s.done } : s));
    setRow({ ...row, steps: next });
    try {
      await toggleSatchelStep(row.id, next);
    } catch {
      setError('the tick did not save. try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-24">
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm mb-3">satchel</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight mb-3">
          Pack a file with a short checklist.
        </motion.h1>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Different from the vault. A local file goes into the shared database, then rides with a few steps the other person can tick. Paste the link in Discord for a card. Older desks stay put. Large files are warned, never blocked.
        </p>

        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{row.author || 'unsigned'}</p>
            <h2 className="text-2xl font-semibold tracking-tight mt-1">{row.title}</h2>
            {row.note && <p className="text-neutral-400 mt-2">{row.note}</p>}
            <a href={row.file_url} className="mt-4 flex items-center justify-between rounded-2xl bg-black/40 border border-white/10 px-4 py-3 hover:border-white/25 transition" download>
              <span>
                <span className="block text-sm">{row.file_name || 'file'}</span>
                <span className="block text-xs text-neutral-500">{prettySize(Number(row.size) || 0)}</span>
              </span>
              <span className="text-sm text-[#0a84ff]">open</span>
            </a>
            <ul className="mt-4 space-y-2">
              {(row.steps || []).map((step: Step) => (
                <li key={step.id}>
                  <button onClick={() => flip(step.id)} className="w-full text-left rounded-2xl px-4 py-3 bg-black/30 border border-white/10 flex items-center gap-3 active:scale-[0.99] transition">
                    <span className={`w-5 h-5 rounded-full border ${step.done ? 'bg-[#0a84ff] border-[#0a84ff]' : 'border-white/30'}`} />
                    <span className={step.done ? 'text-neutral-500 line-through' : ''}>{step.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-neutral-500 break-all">{link || `${window.location.origin}/satchel/${row.id}`}</p>
          </motion.section>
        ) : (
          <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer hover:border-white/30 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="block text-sm">{file ? file.name : 'Choose a file from this computer'}</span>
              <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'stored with the handoff, not only in the vault'}</span>
            </label>
            {warn && <p className="mt-3 text-sm text-amber-200/90">{warn}</p>}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this handoff is called" className="mt-4 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the Discord card" rows={2} className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="one step per line" rows={4} className="mt-3 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button disabled={!file || busy} className="mt-4 w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 active:scale-[0.99] transition">
              {busy ? 'packing…' : 'share this satchel'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
