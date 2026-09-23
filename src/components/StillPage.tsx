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

export default function StillPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: string; name: string; size: number; embed: string; app: string } | null>(null);
  const [copied, setCopied] = useState('');

  const onFile = async (file: File) => {
    setErr('');
    setDone(null);
    const size = file.size || 0;
    if (size > 12 * 1024 * 1024) {
      setWarn('big file. no cap here, but the tab and host can feel slow while it lands.');
    } else {
      setWarn('');
    }
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
        name: file.name || 'drop',
        type: file.type || 'application/octet-stream',
        size,
        dataUrl,
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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">still</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park one file in the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-6">local file goes to the share db. discord gets a clean embed. no hard size lock, just a heads up when it gets chunky.</p>

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
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center"
          >
            <p className="text-white text-sm font-medium">{busy ? 'uploading…' : 'drop or pick a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">stays public until you expire it from another desk</p>
          </motion.button>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-300/80 mt-4">{err}</p>}

          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-white/[0.03] border border-white/5 p-4"
            >
              <p className="text-white text-sm truncate">{done.name}</p>
              <p className="text-xs text-neutral-500 mb-3">{formatBytes(done.size)} · live share</p>
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
