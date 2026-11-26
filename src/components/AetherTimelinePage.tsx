import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Event = { id: string; title: string; date: string; note: string; file?: File; share?: string };

export default function AetherTimelinePage() {
  const { navigate } = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('Aether Timeline');
  const [caption, setCaption] = useState('a quiet sequence of moments');
  const [publishing, setPublishing] = useState(false);

  const addEvent = () => {
    setEvents(prev => [...prev, { id: Date.now().toString(36), title: '', date: '', note: '' }]);
  };

  const update = (id: string, patch: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const publishTimeline = async () => {
    setPublishing(true);
    const lines = [`# ${title}\n\n${caption}\n`];
    for (const ev of events) {
      lines.push(`## ${ev.date || 'undated'} — ${ev.title || 'untitled'}`);
      if (ev.note) lines.push(ev.note);
      if (ev.file) {
        try {
          const pub = await publishLocalFile(ev.file, { caption: ev.note || caption, cardTitle: ev.title, color: '#0A84FF' });
          if (pub.ok && pub.id) {
            const url = shareUrls(pub.id).embed;
            lines.push(`Attachment: ${url}`);
            update(ev.id, { share: url });
          }
        } catch {}
      }
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const file = new File([blob], `${title.replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
    try {
      const pub = await publishLocalFile(file, { caption, cardTitle: title, color: '#0A84FF' });
      if (pub.ok && pub.id) {
        navigator.clipboard.writeText(shareUrls(pub.id).embed);
        alert('timeline share link copied');
      }
    } catch {}
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="text-[#0A84FF] text-sm mb-2">aether timeline</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">sequence moments with files.</h1>
          <p className="text-neutral-400 text-sm">Build a timeline, attach local files, then publish the whole as one Discord-ready markdown share. Soft warnings only.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-lg font-medium outline-none border-b border-white/10 pb-2" />
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2} className="w-full bg-transparent text-sm text-neutral-300 outline-none resize-none" />
        </div>

        <AnimatePresence>
          {events.map(ev => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 mb-4 space-y-3">
              <div className="flex gap-3">
                <input value={ev.date} onChange={e => update(ev.id, { date: e.target.value })} placeholder="date" className="bg-white/5 rounded-xl px-3 py-2 text-sm w-32 outline-none" />
                <input value={ev.title} onChange={e => update(ev.id, { title: e.target.value })} placeholder="title" className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <textarea value={ev.note} onChange={e => update(ev.id, { note: e.target.value })} placeholder="note" rows={2} className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm outline-none resize-none" />
              <input type="file" onChange={e => e.target.files?.[0] && update(ev.id, { file: e.target.files[0] })} className="text-xs text-neutral-500" />
              {ev.share && <p className="text-xs text-[#0A84FF] truncate">shared: {ev.share}</p>}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          <button onClick={addEvent} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">add moment</button>
          <button onClick={publishTimeline} disabled={publishing || !events.length} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm disabled:opacity-50">{publishing ? 'publishing…' : 'publish timeline'}</button>
        </div>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white">← back home</button>
      </div>
    </div>
  );
}
