import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

const KEY = 'rankvault-bothy-notes';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Note = { id: string; text: string; at: number };

export default function BothyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [embed, setEmbed] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Note[]) => {
    setNotes(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = () => {
    if (!draft.trim()) return;
    persist([{ id: uid(), text: draft.trim(), at: Date.now() }, ...notes].slice(0, 40));
    setDraft('');
  };

  const publishAll = async () => {
    if (!notes.length) return;
    setBusy(true);
    setErr('');
    const text = notes.map((n) => `— ${new Date(n.at).toLocaleString()}\n${n.text}`).join('\n\n');
    const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    try {
      const id = uid();
      const pub = await publishShare({
        id,
        name: 'bothy-notes.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl,
        author: 'bothy',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish bothy');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'bothy failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">bothy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a hut for scraps.</h1>
          <p className="text-neutral-400 text-sm mb-6">notes stay on this device until you choose to walk them out as one public drop. discord gets the embed link.</p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} placeholder="leave something on the bench" className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <div className="flex gap-2 mb-6">
            <button onClick={add} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">keep locally</button>
            <button onClick={publishAll} disabled={busy || !notes.length} className="px-4 py-2 rounded-full glass text-sm">{busy ? 'packing the hut…' : 'publish the stack'}</button>
          </div>
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 text-sm text-neutral-300 whitespace-pre-wrap">{n.text}</li>
            ))}
          </ul>
          {err && <p className="mt-4 text-rose-300 text-sm break-all">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
