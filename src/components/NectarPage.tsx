import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export default function NectarPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [done, setDone] = useState<{ embed: string; app: string; id: string } | null>(null);
  const [copied, setCopied] = useState('');

  const publish = async () => {
    setErr('');
    setDone(null);
    const body = text.trim();
    if (!body) {
      setErr('write something first');
      return;
    }
    if (body.length > 200_000) setWarn('long note. clients may lag. no hard cap.');
    setBusy(true);
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'nectar.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not land in the db');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ id: res.id || id, embed: urls.embed, app: urls.app });
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">nectar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pour a note into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault folder. just a text drop with a discord card on /s/.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="type the thing you actually want to send"
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 text-sm outline-none focus:border-white/20 resize-y min-h-[180px]"
          />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => void publish()}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'pouring…' : 'publish note'}
          </motion.button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-300/80 mt-4">{err}</p>}
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl bg-white/[0.03] border border-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">live</p>
              <p className="text-xs text-neutral-400 mb-3 break-all">{done.id}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(done.embed);
                    setCopied(done.embed);
                  }}
                  className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
                >
                  copy discord link
                </button>
                <a href={done.app} className="px-4 py-2 rounded-full bg-white/5 text-sm">open drop</a>
              </div>
              {copied && <p className="text-xs text-neutral-500 mt-3 break-all">{copied}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
