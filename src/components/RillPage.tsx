import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useAuth } from './AuthContext';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function RillPage() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('untitled rill');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const publish = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    setDone(null);
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    if (blob.size > 8 * 1024 * 1024) {
      setWarn('long stream. clients may feel slow. still no cap.');
    } else {
      setWarn('');
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not encode'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: `${title.replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80) || 'rill'}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish the rill');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setDone(shareUrls(res.id || id));
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">rill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a running note, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            dump a stream of text, publish it as a public drop. discord unfurls the /s/ link.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            placeholder="title"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="let it run…"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[180px]"
          />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!text.trim() || busy}
            onClick={publish}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'publishing…' : 'publish rill'}
          </motion.button>
          {done && (
            <div className="mt-6 text-sm space-y-1">
              <p className="text-neutral-500 text-xs">discord embed</p>
              <p className="break-all text-[#0a84ff]">{done.embed}</p>
              <button
                onClick={() => navigator.clipboard.writeText(done.embed)}
                className="mt-2 px-4 py-2 rounded-full bg-white/5 text-xs"
              >
                copy link
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
