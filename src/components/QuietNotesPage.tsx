import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietNotesPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setErr('');
    setLink('');
    const name = (title.trim() || 'note') + '.txt';
    const file = new File([body], name, { type: 'text/plain' });
    if (file.size > 2 * 1024 * 1024) setWarn('Long note — the browser may feel slower. No hard limit.');
    try {
      const res = await publishLocalFile(file, {
        caption: title.trim() || 'quiet note',
        cardTitle: name,
        color: '#5AC8FA',
        meta: { desk: 'quietnotes' },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
      } else {
        setErr(res.error || 'could not publish');
      }
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-10"
        >
          <p className="text-[#5AC8FA] text-sm font-medium mb-2 tracking-wide">quiet notes</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">write something soft.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            A note desk. It becomes a file, lands in the same database, and every link carries a polished Discord embed. Soft size warnings only. All other desks stay exactly as they were.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="the note…"
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/25 resize-none"
          />

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !body.trim()}
            className="w-full rounded-2xl py-3.5 text-sm font-medium text-black bg-[#5AC8FA] disabled:opacity-40 transition"
          >
            {busy ? 'publishing…' : 'publish note'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm">
              <p className="text-neutral-500 mb-1">share link</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-[#5AC8FA] break-all hover:underline">
                {link}
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
