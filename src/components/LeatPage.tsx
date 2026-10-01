import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function LeatPage() {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(180);
  const [left, setLeft] = useState(180);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setRunning(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running]);

  const start = () => {
    setLeft(seconds);
    setRunning(true);
    setLink('');
  };

  const pour = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    if (text.length > 8 * 1024 * 1024) setWarn('a long channel. the tab may feel slow. no cap.');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'leat.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'leat',
      });
      if (!res.ok) throw new Error(res.error || 'the channel silted');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">leat</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">let a channel run.</h1>
          <p className="text-neutral-400 text-sm mb-6">a timed writing race. when the water stops you can hang the draft on the share table. discord cards /s. nothing lives in the vault unless you put it there.</p>
          <div className="flex items-end justify-between gap-4 mb-4">
            <p className="text-4xl font-semibold tracking-tight tabular-nums">{mm}:{ss}</p>
            <label className="text-xs text-neutral-500">
              minutes
              <input
                type="number"
                min={1}
                max={30}
                value={Math.round(seconds / 60)}
                onChange={(e) => setSeconds(Math.max(1, Number(e.target.value) || 1) * 60)}
                disabled={running}
                className="ml-2 w-14 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-sm outline-none"
              />
            </label>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="open the sluice…"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-y min-h-[180px]"
          />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={start} disabled={running} className="px-5 py-2.5 rounded-full glass text-sm text-neutral-200 disabled:opacity-40">start the run</button>
            <button onClick={pour} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
              {busy ? 'pouring…' : 'pour into the db'}
            </button>
          </div>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
