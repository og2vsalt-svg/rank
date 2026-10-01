import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PlinthPage() {
  const [text, setText] = useState('read this once, slowly, then decide if it leaves the room.');
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const seconds = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(15, Math.round((words / 180) * 60));
  }, [text]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setRunning(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const id = uid();
      const res = await publishShare({
        id,
        name: 'plinth.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`,
        author: 'plinth',
        caption: `${text.trim().split(/\s+/).filter(Boolean).length} words · a quiet reading`,
      });
      if (!res.ok) throw new Error(res.error || 'could not set the passage');
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
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-7">
          <p className="text-[#0a84ff] text-sm font-medium mb-2">plinth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a stand for one passage</h1>
          <p className="text-neutral-400 text-sm mb-5">times a reading at a calm 180 words a minute. stays here unless you publish it.</p>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setRunning(false); }} rows={7} className="w-full rounded-3xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm leading-relaxed outline-none mb-4" />
          <div className="flex items-center justify-between mb-5">
            <p className="text-neutral-400 text-sm tabular-nums">{running || left ? `${left}s left` : `${seconds}s to read`}</p>
            <button
              onClick={() => { setLeft(seconds); setRunning(true); }}
              className="px-4 py-2 rounded-full bg-white/10 text-sm"
            >start</button>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-5">
            <motion.div className="h-full bg-[#0a84ff]" animate={{ width: `${seconds ? ((seconds - left) / seconds) * 100 : 0}%` }} transition={{ duration: 0.3 }} />
          </div>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'setting…' : 'publish the passage'}</button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
