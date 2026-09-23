import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

type Row = {
  localId: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  status: 'ready' | 'sending' | 'live' | 'err';
  id?: string;
  warn?: string;
  error?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' mb';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' gb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function QuayPage() {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [author, setAuthor] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const sleepy = rows.some((r) => r.size > 40 * 1024 * 1024);

  function readFile(file: File): Promise<Row> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          localId: uid(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: String(reader.result || ''),
          status: 'ready',
          warn: file.size > 40 * 1024 * 1024 ? 'huge file. tab might hitch, still no cap.' : undefined,
        });
      reader.readAsDataURL(file);
    });
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = await Promise.all(Array.from(list).map(readFile));
    setRows((prev) => [...next, ...prev]);
  }

  async function launch(row: Row) {
    setRows((prev) => prev.map((r) => (r.localId === row.localId ? { ...r, status: 'sending' } : r)));
    const id = uid();
    const res = await publishShare({
      id,
      name: row.name,
      type: row.type,
      size: row.size,
      dataUrl: row.dataUrl,
      author: author.trim() || undefined,
    });
    setRows((prev) =>
      prev.map((r) =>
        r.localId === row.localId
          ? res.ok
            ? { ...r, status: 'live', id: res.id || id, warn: res.warn || r.warn }
            : { ...r, status: 'err', error: res.error || 'could not land' }
          : r
      )
    );
  }

  async function launchAll() {
    const ready = rows.filter((r) => r.status === 'ready');
    for (const r of ready) await launch(r);
  }

  async function copyEmbed(id: string) {
    const url = shareUrls(id).embed;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">quay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a dock, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            park local files here, then shove them into the share db one by one. discord scrapes /s/id. no hard size cap —
            just a sleepy warning if a drop is huge.
          </p>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="optional author stamp"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <input ref={input} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <div className="flex flex-wrap gap-2 mb-6">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => input.current?.click()}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
            >
              add files
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={launchAll}
              disabled={!rows.some((r) => r.status === 'ready')}
              className="px-5 py-2.5 rounded-full bg-white/8 text-sm disabled:opacity-40"
            >
              launch ready
            </motion.button>
          </div>
          {sleepy && (
            <p className="text-[12px] text-amber-300/80 mb-4">one of these is chunky. still accepted. preview clients may feel slow.</p>
          )}
          <div className="space-y-2">
            <AnimatePresence>
              {rows.map((r) => (
                <motion.div
                  key={r.localId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{r.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {pretty(r.size)} · {r.status}
                        {r.warn ? ' · ' + r.warn : ''}
                        {r.error ? ' · ' + r.error : ''}
                      </p>
                    </div>
                    {r.status === 'ready' && (
                      <button onClick={() => launch(r)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">
                        launch
                      </button>
                    )}
                    {r.status === 'live' && r.id && (
                      <button onClick={() => copyEmbed(r.id!)} className="text-xs px-3 py-1.5 rounded-full bg-[#5865F2] text-white">
                        {copied === r.id ? 'copied' : 'discord'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!rows.length && <p className="text-sm text-neutral-500">dock is empty. drop something in.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
