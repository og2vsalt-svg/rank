import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function JsonPage() {
  const [raw, setRaw] = useState('{\n  "hello": "vault"\n}');
  const parsed = useMemo(() => {
    try {
      return { ok: true as const, pretty: JSON.stringify(JSON.parse(raw), null, 2), err: '' };
    } catch (e: any) {
      return { ok: false as const, pretty: raw, err: e?.message || 'bad json' };
    }
  }, [raw]);
  const pretty = parsed.pretty;
  const err = parsed.err;

  const minify = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(raw));
    } catch {
      return '';
    }
  }, [raw]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">json</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tidy a blob of json.</h1>
          <p className="text-neutral-400 text-sm mb-6">pretty print or crush it. stays in this tab.</p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono outline-none mb-3"
          />
          {err && <p className="text-xs text-amber-400 mb-3">{err}</p>}
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setRaw(pretty)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">pretty</button>
            <button onClick={() => minify && setRaw(minify)} className="px-4 py-2 rounded-full glass text-sm">minify</button>
            <button onClick={() => navigator.clipboard.writeText(pretty)} className="px-4 py-2 rounded-full glass text-sm">copy pretty</button>
          </div>
          <pre className="text-xs text-neutral-400 overflow-auto max-h-72 rounded-2xl bg-black/30 p-4">{pretty}</pre>
        </motion.div>
      </div>
    </div>
  );
}
