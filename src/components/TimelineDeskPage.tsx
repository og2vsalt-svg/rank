import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Event = {
  id: string;
  date: string;
  title: string;
  note: string;
  file: File | null;
  preview?: string;
};

export default function TimelineDeskPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [events, setEvents] = useState<Event[]>([
    { id: Math.random().toString(36).slice(2, 9), date: new Date().toISOString().slice(0, 10), title: '', note: '', file: null },
  ]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const addEvent = () => {
    setEvents((p) => [
      ...p,
      { id: Math.random().toString(36).slice(2, 9), date: new Date().toISOString().slice(0, 10), title: '', note: '', file: null },
    ]);
  };

  const update = (id: string, patch: Partial<Event>) => {
    setEvents((p) => p.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)));
  };

  const onFile = (id: string, f: File | null) => {
    if (f && f.size > 40_000_000) setWarn('Large file may take a moment. No hard limits.');
    else setWarn(null);
    update(id, {
      file: f,
      preview: f && f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    });
  };

  const publish = async () => {
    if (busy) return;
    const usable = events.filter((e) => e.title.trim() || e.note.trim() || e.file);
    if (!usable.length) return;
    setBusy(true);
    try {
      const published: { date: string; title: string; note: string; fileLink?: string; name?: string }[] = [];
      for (const ev of usable) {
        let fileLink: string | undefined;
        if (ev.file) {
          const res = await publishLocalFile(ev.file, {
            caption: ev.note.trim() || ev.title.trim() || ev.file.name,
            color: '#0A84FF',
            cardTitle: ev.title.trim() || ev.file.name,
            meta: { desk: 'timelinedesk', parent: title || 'timeline', eventDate: ev.date },
          });
          if (res.ok && res.id) fileLink = shareUrls(res.id).app;
        }
        published.push({
          date: ev.date,
          title: ev.title.trim(),
          note: ev.note.trim(),
          fileLink,
          name: ev.file?.name,
        });
      }

      const sorted = [...published].sort((a, b) => a.date.localeCompare(b.date));

      const md = [
        `# ${title.trim() || 'Timeline'}`,
        '',
        ...sorted.map((p) => {
          const lines = [`## ${p.date}${p.title ? ` — ${p.title}` : ''}`];
          if (p.note) lines.push(p.note);
          if (p.fileLink) lines.push(`\nFile: [${p.name || 'attachment'}](${p.fileLink})`);
          return lines.join('\n');
        }),
        '',
        '_A quiet timeline from rankvault. Soft size warnings only. Polished Discord embeds on every link._',
      ].join('\n');

      const blob = new Blob([md], { type: 'text/markdown' });
      const boardFile = new File([blob], `${(title || 'timeline').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.md`, {
        type: 'text/markdown',
      });
      const boardRes = await publishLocalFile(boardFile, {
        caption: title.trim() || 'Timeline sequence',
        color: '#0A84FF',
        cardTitle: title.trim() || 'Timeline',
        meta: { desk: 'timelinedesk', events: published.length },
      });
      if (boardRes.ok && boardRes.id) setLink(shareUrls(boardRes.id).app);
    } finally {
      setBusy(false);
    }
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
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Timeline Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Sequence quiet moments.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Build a dated sequence of titles, notes, and optional local files. Publish the whole timeline as a permanent markdown share. Every link carries a polished Discord embed. Soft size warnings only. Apple-style springs on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Timeline title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <AnimatePresence>
            {events.map((ev, idx) => (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="glass rounded-2xl p-5 mb-4 border border-white/5"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-neutral-500">Moment {idx + 1}</span>
                  {events.length > 1 && (
                    <button
                      onClick={() => setEvents((p) => p.filter((x) => x.id !== ev.id))}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => update(ev.id, { date: e.target.value })}
                    className="bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                  />
                  <input
                    value={ev.title}
                    onChange={(e) => update(ev.id, { title: e.target.value })}
                    placeholder="Title (optional)"
                    className="bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                  />
                </div>
                <textarea
                  value={ev.note}
                  onChange={(e) => update(ev.id, { note: e.target.value })}
                  placeholder="Quiet note about this moment…"
                  rows={3}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 mb-3 resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 hover:bg-white/10 cursor-pointer">
                    {ev.file ? ev.file.name.slice(0, 24) : 'attach file'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => onFile(ev.id, e.target.files?.[0] || null)}
                    />
                  </label>
                  {ev.preview && <img src={ev.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addEvent} className="text-sm text-[#0A84FF] mb-6 hover:underline">
            + add another moment
          </button>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Publish timeline'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-neutral-400 mb-2">Permanent timeline link</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm break-all">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
