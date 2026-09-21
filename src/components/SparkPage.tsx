import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function SparkPage() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [name, setName] = useState('spark.txt');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string } | null>(null);

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      if (blob.size > 8 * 1024 * 1024) setWarn('big paste. still going, might feel slow. no cap.');
      else setWarn('');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = rid();
      const res = await publishShare({
        id,
        name: name.trim() || 'spark.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not park the spark');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setDone(shareUrls(res.id || id));
    } catch (e: any) {
      setErr(e?.message || 'spark failed');
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
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">spark</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">dump text straight to the db</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault thing. just a raw note that becomes a public drop with a discord embed.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            placeholder="filename"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="paste anything"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none resize-y min-h-[160px]"
          />
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <button
            disabled={!text.trim() || busy}
            onClick={publish}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sparking…' : 'publish spark'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {done && (
            <div className="mt-6 text-sm space-y-1">
              <p className="text-neutral-400 break-all">{done.app}</p>
              <p className="text-[#0a84ff] break-all">{done.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(done.embed)} className="mt-2 px-4 py-2 rounded-full bg-white/5 text-sm">copy discord link</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
