import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuietChecklistPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<{ text: string; done: boolean }[]>([{ text: '', done: false }]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (i: number, text: string) => {
    const next = [...items];
    next[i].text = text;
    setItems(next);
  };
  const toggle = (i: number) => {
    const next = [...items];
    next[i].done = !next[i].done;
    setItems(next);
  };
  const addItem = () => setItems([...items, { text: '', done: false }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (!title.trim()) {
      setError('give the checklist a title');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      const markdown = `# ${title}\n\n${items.filter(it => it.text.trim()).map(it => `- [${it.done ? 'x' : ' '}] ${it.text}`).join('\n')}\n\n${note || ''}`;
      const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const pub = await publishShare({
        id,
        name: `${title.trim() || 'checklist'}.md`,
        type: 'text/markdown',
        size: markdown.length,
        dataUrl,
        caption: note.slice(0, 180) || title,
      });
      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        setResult({ url: urls.embed, warn: pub.warn || undefined });
      } else {
        setError(pub.error || 'could not publish');
      }
    } catch (e: any) {
      setError(e?.message || 'something quiet went wrong');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">quiet checklist</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">list the quiet things.<br />share the path.</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">Build a living checklist. Add items, mark them done, add a note. Publish the whole list as a permanent Discord-ready markdown share. Soft warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.05 }}
            className="space-y-5"
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="checklist title" className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition" />
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => toggle(i)} className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${it.done ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/20'}`}>
                    {it.done && '✓'}
                  </button>
                  <input value={it.text} onChange={(e) => updateItem(i, e.target.value)} placeholder="item…" className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50" />
                  <button type="button" onClick={() => removeItem(i)} className="text-xs text-neutral-500 hover:text-white">×</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm text-[#0A84FF] hover:underline">+ add item</button>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional quiet note…" rows={3} className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none" />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
              <span className="text-xs text-neutral-400">{accent}</span>
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={publish} disabled={publishing} className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50">
              {publishing ? 'publishing…' : 'publish checklist'}
            </motion.button>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
            className="glass rounded-3xl p-6 sticky top-24"
          >
            <p className="text-xs text-neutral-500 mb-4">live preview</p>
            <div className="rounded-2xl overflow-hidden border border-white/5" style={{ borderTop: `3px solid ${accent}` }}>
              <div className="p-5">
                <h3 className="font-medium text-lg mb-2">{title || 'untitled checklist'}</h3>
                <ul className="space-y-1 text-sm text-neutral-300">
                  {items.filter(it => it.text.trim()).map((it, i) => (
                    <li key={i} className={it.done ? 'line-through text-neutral-500' : ''}>• {it.text}</li>
                  ))}
                </ul>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed mt-2">{note || ''}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">the published link carries a polished Discord embed.</p>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-12 text-center space-y-4">
              <p className="text-sm text-neutral-400">checklist is live</p>
              <button onClick={() => navigator.clipboard.writeText(result.url)} className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium">copy share link</button>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigate('home')} className="block mx-auto text-sm text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
