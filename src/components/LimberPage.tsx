import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LimberPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState('');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const pace = useMemo(() => {
    const words = body.trim() ? body.trim().split(/\s+/).length : 0;
    if (!seconds || !words) return 'start the clock, then write';
    const wpm = Math.round((words / seconds) * 60);
    return `${words} words · ${wpm} wpm`;
  }, [body, seconds]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const publish = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setError('');
    const id = uid();
    const name = `${(title.trim() || 'limber').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 60)}.md`;
    const markdown = `# ${title.trim() || 'limber'}

${text}

_timed ${clock} · ${pace}_
`;
    const dataUrl = `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(markdown)))}`;
    const res = await publishShare({
      id,
      name,
      type: 'text/markdown',
      size: markdown.length,
      dataUrl,
      author: 'limber',
      caption: title.trim() || 'a timed note',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the share table did not take the note');
      return;
    }
    setEmbed(shareUrls(res.id).embed);
    setWarn(res.warn || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64D2FF] text-sm font-medium mb-2">limber</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">time a note, then file the page.</h1>
          <p className="text-neutral-400 text-sm mb-8">this is a writing desk, not a drawer. the draft stays in the tab until you publish it as markdown in the share table. Discord unfurls /limber and the /s card. nothing is refused for length — a long page may just feel slow to send.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4 mb-5">
            <p className="text-5xl font-semibold tracking-tight tabular-nums text-white">{clock}</p>
            <p className="text-xs text-neutral-500 text-right">{pace}</p>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setRunning((v) => !v)} className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium">{running ? 'pause' : 'start'}</button>
            <button onClick={() => { setRunning(false); setSeconds(0); }} className="rounded-full bg-white/8 text-white px-4 py-2 text-sm">reset</button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="write while the clock runs" className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/50 resize-none" />
          {body.length > 20000 && <p className="mt-3 text-xs text-amber-300/90">long note. it will still publish, but the send may feel slow.</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={busy || !body.trim()} onClick={publish} className="mt-4 rounded-full bg-[#64D2FF] text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file the note'}</button>
        </motion.div>
        {embed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mt-4">
            <p className="text-sm text-white">filed. paste this in Discord.</p>
            <p className="text-xs text-neutral-500 mt-1 break-all">{embed}</p>
            {warn && <p className="text-xs text-amber-300/90 mt-2">{warn}</p>}
            <button onClick={() => navigator.clipboard.writeText(embed)} className="mt-3 text-xs px-3 py-1.5 rounded-full bg-white text-black">copy card link</button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
