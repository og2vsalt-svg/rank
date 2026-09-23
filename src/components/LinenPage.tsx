import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function LinenPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<{ id: string; name: string; size: number; embed: string; app: string } | null>(null);
  const [copied, setCopied] = useState('');

  const onFile = async (file: File) => {
    setErr('');
    setDone(null);
    const size = file.size || 0;
    setWarn(size > 12 * 1024 * 1024 ? 'chunky file. no cap, the tab just might lag while it lands.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name || 'linen',
        type: file.type || 'application/octet-stream',
        size,
        dataUrl,
        author: note || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'share failed');
        return;
      }
      const urls = shareUrls(res.id || id);
      setDone({ id: res.id || id, name: file.name, size, embed: urls.embed, app: urls.app });
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'could not publish');
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
          <p className="text-[#0a84ff] text-sm mb-2">linen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">print a share ticket.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a local file, park it in the share db, walk away with a discord-ready /s/ card. not a vault clone.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional label on the ticket"
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 text-sm outline-none focus:border-white/20"
          />
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center transition-colors hover:bg-white/[0.05]"
          >
            <p className="text-white text-sm font-medium">{busy ? 'pressing the ticket…' : 'choose a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard size lock</p>
          </motion.button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-300/80 mt-4">{err}</p>}
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl bg-white/[0.03] border border-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">ticket</p>
              <p className="text-white text-sm truncate">{done.name}</p>
              <p className="text-xs text-neutral-500 mb-4">{formatBytes(done.size)} · {done.id}</p>
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
