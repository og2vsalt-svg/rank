import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Stall = {
  key: string;
  file: File;
  tag: string;
};

export default function MewsPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [busyKey, setBusyKey] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [last, setLast] = useState<{ name: string; embed: string; app: string } | null>(null);

  const total = useMemo(() => stalls.reduce((n, s) => n + s.file.size, 0), [stalls]);

  const take = (list: FileList | File[] | null) => {
    if (!list) return;
    const next = Array.from(list).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      tag: '',
    }));
    setStalls((prev) => [...prev, ...next]);
    const big = next.some((s) => s.file.size > 40 * 1024 * 1024);
    setWarn(big ? 'no cap. large files can make this tab feel sleepy while they encode.' : '');
  };

  const ship = async (stall: Stall) => {
    setErr('');
    setBusyKey(stall.key);
    try {
      const dataUrl = await readAsDataUrl(stall.file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = stall.tag ? `${stall.tag} — ${stall.file.name}` : stall.file.name;
      const res = await publishShare({
        id,
        name,
        type: stall.file.type || 'application/octet-stream',
        size: stall.file.size,
        dataUrl,
        author: 'mews',
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLast({ name, embed: urls.embed, app: urls.app });
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'could not ship');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mews</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">an alley of local files, then one public drop.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            keep a quiet row of files in this tab. tag them if you want. ship one into the share db when you are ready. not the vault.
          </p>
          <label
            className="block cursor-pointer rounded-[28px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              take(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">drop a few into the alley</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {stalls.length > 0 && (
            <p className="text-xs text-neutral-500 mt-4">
              {stalls.length} in the mews · {pretty(total)}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <div className="mt-6 space-y-3">
            {stalls.map((s) => (
              <div key={s.key} className="glass rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm truncate">{s.file.name}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{pretty(s.file.size)} · {s.file.type || 'unknown'}</p>
                </div>
                <input
                  value={s.tag}
                  onChange={(e) =>
                    setStalls((prev) => prev.map((x) => (x.key === s.key ? { ...x, tag: e.target.value } : x)))
                  }
                  placeholder="tag"
                  className="sm:w-36 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  disabled={!!busyKey}
                  onClick={() => ship(s)}
                  className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  {busyKey === s.key ? '…' : 'ship'}
                </button>
                <button
                  onClick={() => setStalls((prev) => prev.filter((x) => x.key !== s.key))}
                  className="px-3 py-2 rounded-full bg-white/8 text-sm text-neutral-300"
                >
                  clear
                </button>
              </div>
            ))}
          </div>
          {last && (
            <div className="glass rounded-3xl p-5 mt-8">
              <p className="text-white text-sm">{last.name}</p>
              <p className="text-[#0a84ff] text-xs mt-2 break-all">{last.embed}</p>
              <p className="text-neutral-500 text-xs mt-1 break-all">{last.app}</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
