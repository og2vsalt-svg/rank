import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function TidePage() {
  const [queue, setQueue] = useState<File[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...queue, ...list];
    setQueue(next);
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one of these is huge. publishing may feel slow. no hard cap.' : '');
  };

  const run = async () => {
    if (!queue.length || busy) return;
    setBusy(true);
    const lines: string[] = [];
    for (const file of queue) {
      try {
        const dataUrl = await readFile(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (res.ok) {
          const urls = shareUrls(res.id || id);
          lines.push(`${file.name} → ${urls.embed}`);
        } else {
          lines.push(`${file.name} failed: ${res.error || 'unknown'}`);
        }
      } catch (e: any) {
        lines.push(`${file.name} failed: ${e?.message || 'read'}`);
      }
      setLog([...lines]);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">tide</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">send files one by one.</h1>
          <p className="text-neutral-400 text-sm mb-6">queue local files and publish each to the share db. discord-ready /s links come back in order. skips the vault grid.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-8 text-center transition-colors">
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-white font-medium">add to the tide</p>
            <p className="text-xs text-neutral-500 mt-2">{queue.length} waiting</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {!!queue.length && (
            <ul className="mt-5 space-y-1 text-sm text-neutral-400">
              {queue.map((f, i) => (
                <li key={i} className="truncate">{f.name}</li>
              ))}
            </ul>
          )}
          <button
            disabled={busy || !queue.length}
            onClick={run}
            className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending…' : 'release'}
          </button>
          {!!log.length && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              {log.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
