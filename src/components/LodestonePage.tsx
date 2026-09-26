import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

const KEY = 'rankvault-lodestone';

export default function LodestonePage() {
  const { navigate } = useRouter();
  const [id, setId] = useState('');
  const [pins, setPins] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [meta, setMeta] = useState<Record<string, CloudMeta | null>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pins));
    pins.forEach(async (p) => {
      if (meta[p]) return;
      const m = await fetchShare(p);
      setMeta((prev) => ({ ...prev, [p]: m }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  const add = () => {
    const clean = id.trim();
    if (!clean) return;
    if (pins.includes(clean)) {
      setMsg('already pinned');
      return;
    }
    setPins([clean, ...pins]);
    setId('');
    setMsg('pinned in this browser');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lodestone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin live shares.</h1>
          <p className="text-neutral-400 text-sm mb-6">keeps a private magnet of share ids in this browser. not another vault.</p>
          <div className="flex gap-2 mb-4">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={add} className="px-4 py-3 rounded-2xl bg-white text-black text-sm font-medium">pin</button>
          </div>
          {msg && <p className="text-xs text-neutral-500 mb-4">{msg}</p>}
          <div className="space-y-2">
            {pins.map((p) => (
              <div key={p} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{meta[p]?.name || p}</p>
                  <p className="text-[11px] text-neutral-500 font-mono">{p}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate('share', p)} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black">open</button>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(p).embed)}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-white/8"
                  >
                    copy /s
                  </button>
                  <button onClick={() => setPins(pins.filter((x) => x !== p))} className="text-[12px] px-3 py-1.5 rounded-full text-neutral-500">drop</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
