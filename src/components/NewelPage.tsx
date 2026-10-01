import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

type Step = { id: string; text: string; done: boolean };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function NewelPage() {
  const [title, setTitle] = useState('before I leave');
  const [draft, setDraft] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { id: 'a', text: 'keys', done: false },
    { id: 'b', text: 'charger', done: false },
  ]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setSteps((s) => [...s, { id: uid(), text, done: false }]);
    setDraft('');
  };

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const body = [`# ${title}`, '', ...steps.map((s) => `- [${s.done ? 'x' : ' '}] ${s.text}`)].join('\n');
      const id = uid();
      const res = await publishShare({
        id,
        name: `${title.replace(/\s+/g, '-').slice(0, 40) || 'newel'}.md`,
        type: 'text/markdown',
        size: body.length,
        dataUrl: `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(body)))}`,
        author: 'newel',
        caption: `${steps.filter((s) => s.done).length}/${steps.length} steps on the stair`,
      });
      if (!res.ok) throw new Error(res.error || 'could not hang the list');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-7"
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">newel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a stair of small jobs</h1>
          <p className="text-neutral-400 text-sm mb-6">tick them off in the tab. the list can leave as one markdown card. not a file drawer.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none mb-4" />
          <ul className="space-y-2 mb-4">
            {steps.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSteps((all) => all.map((x) => x.id === s.id ? { ...x, done: !x.done } : x))}
                  className="w-full text-left flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/5 transition-colors duration-200"
                >
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] transition-all duration-200 ${s.done ? 'bg-white text-black border-white' : 'border-white/20'}`}>{s.done ? '✓' : ''}</span>
                  <span className={s.done ? 'text-neutral-500 line-through' : 'text-neutral-100'}>{s.text}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-5">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="next step" className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none" />
            <button onClick={add} className="px-4 rounded-full bg-white/10 text-sm">add</button>
          </div>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !steps.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'hanging…' : 'publish the stair'}</button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
