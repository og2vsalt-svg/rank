import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

const KEY = 'rankvault-nook';

function loadPins(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default function NookPage() {
  const [pins, setPins] = useState<string[]>(() => loadPins());
  const [draft, setDraft] = useState('');
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pins));
    let alive = true;
    (async () => {
      const next: CloudMeta[] = [];
      for (const id of pins) {
        const meta = await fetchShare(id);
        if (meta) next.push(meta);
      }
      if (alive) setRows(next);
    })();
    return () => { alive = false; };
  }, [pins]);

  const add = () => {
    const id = draft.trim().replace(/^.*\/s\//, '').replace(/[^a-z0-9_-]/gi, '');
    if (!id) {
      setErr('paste a drop id or /s link.');
      return;
    }
    setErr('');
    setDraft('');
    setPins((prev) => Array.from(new Set([id, ...prev])));
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
          <p className="text-[#0a84ff] text-sm mb-2">nook</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep a pocket of live drop ids.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault grid. ids stay in this browser. we only look them up in the public share db.
          </p>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
              placeholder="drop id or /s/id"
              className="flex-1 rounded-full bg-black/30 border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={add} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">pin</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((row) => {
              const urls = shareUrls(row.id);
              return (
                <div key={row.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-sm text-white">{row.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{row.id} · {row.type}</p>
                  <p className="text-xs text-neutral-400 break-all mt-2">{urls.embed}</p>
                  <button
                    onClick={() => setPins((prev) => prev.filter((x) => x !== row.id))}
                    className="text-xs text-neutral-500 hover:text-white mt-2"
                  >
                    unpin
                  </button>
                </div>
              );
            })}
            {pins.length === 0 && <p className="text-sm text-neutral-500">empty pocket.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
