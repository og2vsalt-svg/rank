import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

const KEY = 'rankvault.garret.ids';

export default function GarretPage() {
  const [raw, setRaw] = useState('');
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(stored)) setIds(stored.filter((x) => typeof x === 'string'));
    } catch {}
  }, []);

  const save = (next: string[]) => {
    const uniq = Array.from(new Set(next)).slice(0, 40);
    setIds(uniq);
    try { localStorage.setItem(KEY, JSON.stringify(uniq)); } catch {}
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const id = raw.trim().replace(/^.*[\/=]/, '');
    if (!id) return;
    save([id, ...ids]);
    setRaw('');
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
          <p className="text-[#0a84ff] text-sm mb-2">garret</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep a local attic of drop ids.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            nothing uploads from this desk. pin public ids in this browser and copy their discord cards.
          </p>
          <form onSubmit={add} className="flex gap-2">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="share id"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              pin
            </button>
          </form>
          <ul className="mt-6 space-y-3">
            {ids.map((id) => {
              const urls = shareUrls(id);
              return (
                <li key={id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-white truncate">{id}</p>
                    <p className="text-xs text-neutral-500 break-all">{urls.embed}</p>
                  </div>
                  <button
                    className="shrink-0 text-xs text-neutral-400 hover:text-white"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(urls.embed); } catch {}
                    }}
                  >
                    copy
                  </button>
                </li>
              );
            })}
          </ul>
          {ids.length > 0 && (
            <button className="mt-6 text-xs text-neutral-500" onClick={() => save([])}>
              clear attic
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
