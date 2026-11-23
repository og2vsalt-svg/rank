import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';
import { useRouter } from './Router';

type LinkItem = { url: string; title: string; note: string };

export default function LinkDeskPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<LinkItem[]>([{ url: '', title: '', note: '' }]);
  const [sharedNote, setSharedNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState('');

  const add = () => setItems((p) => [...p, { url: '', title: '', note: '' }]);
  const update = (i: number, field: keyof LinkItem, val: string) => {
    setItems((p) => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };
  const remove = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const publish = async () => {
    const valid = items.filter((it) => it.url.trim());
    if (!valid.length || busy) return;
    setBusy(true);
    setError('');
    try {
      const md = [
        `# ${sharedNote.trim() || 'quiet links'}`,
        '',
        ...valid.map((it) => `- [${it.title.trim() || it.url}](${it.url.trim()})${it.note.trim() ? ` — ${it.note.trim()}` : ''}`),
        '',
        `_shared via rankvault_`,
      ].join('\n');
      const dataUrl = 'data:text/markdown;base64,' + btoa(unescape(encodeURIComponent(md)));
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: sharedNote.trim() || 'links',
        type: 'text/markdown',
        size: md.length,
        dataUrl,
        caption: sharedNote.trim() || 'a collection of quiet links',
      });
      if (res.ok && res.id) {
        setLink(`${location.origin}/s/${res.id}`);
      } else {
        setError(res.error || 'could not publish');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Link Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Quiet collections.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Gather links with optional titles and notes. Publish them as a permanent markdown share with polished Discord embeds. Soft warnings only.
          </p>

          <textarea
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Optional shared note"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {items.map((it, i) => (
            <motion.div key={i} layout className="glass rounded-2xl p-4 mb-3 border border-white/5 space-y-2">
              <input
                value={it.url}
                onChange={(e) => update(i, 'url', e.target.value)}
                placeholder="https://"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
              />
              <input
                value={it.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="optional title"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
              />
              <input
                value={it.note}
                onChange={(e) => update(i, 'note', e.target.value)}
                placeholder="optional note"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
              />
              {items.length > 1 && (
                <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white">remove</button>
              )}
            </motion.div>
          ))}

          <button onClick={add} className="text-sm text-[#0A84FF] mb-6">+ add link</button>

          {error && <p className="text-[13px] text-red-400 mb-5">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.some((it) => it.url.trim())}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share collection'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm">{link}</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
