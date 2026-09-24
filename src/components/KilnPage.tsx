import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

type Dropped = {
  id: string;
  name: string;
  size: number;
  embed: string;
  app: string;
  warn?: string;
};

export default function KilnPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<Dropped[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(chunky ? 'one of these is huge. still going — tab might crawl while it encodes. no cap.' : '');
    setErr('');
    setBusy(true);
    const next: Dropped[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('could not read ' + file.name));
          r.readAsDataURL(file);
        });
        const id = rid();
        const res = await publishShare({
          id,
          name: note ? `${note} · ${file.name}` : file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: user?.username,
        });
        if (!res.ok) {
          setErr(res.error || 'could not park ' + file.name);
          continue;
        }
        const urls = shareUrls(res.id || id);
        next.push({
          id: res.id || id,
          name: file.name,
          size: file.size,
          embed: urls.embed,
          app: urls.app,
          warn: res.warn,
        });
      }
      setDone((prev) => [...next, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'kiln failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">kiln</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">batch fire files into the cloud</h1>
          <p className="text-sm text-neutral-500 mb-6">
            pick a handful from this machine. each one lands in the share db with a discord-ready embed link. no hard size lock.
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional label stamped on each name"
            className="mb-4 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />

          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            disabled={busy}
            className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-sm text-neutral-400 hover:border-[#0a84ff]/40 hover:text-white transition disabled:opacity-50"
          >
            {busy ? 'firing…' : 'drop a stack or click to pick'}
          </button>

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          {done.length > 0 && (
            <div className="mt-7 space-y-3">
              {done.map((d) => (
                <div key={d.id} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                  <p className="text-sm text-white truncate">{d.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{formatBytes(d.size)}</p>
                  <p className="text-[11px] text-[#0a84ff] break-all mt-2">{d.embed}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(d.embed)}
                      className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                    >
                      copy discord link
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(d.app)}
                      className="px-3 py-1.5 rounded-full bg-white/5 text-xs"
                    >
                      copy app link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
