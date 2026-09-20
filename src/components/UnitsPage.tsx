import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const tables: Record<string, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.344 },
  mass: { mg: 0.000001, g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523125 },
  data: { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 },
};

export default function UnitsPage() {
  const [kind, setKind] = useState<keyof typeof tables>('data');
  const units = Object.keys(tables[kind]);
  const [from, setFrom] = useState('mb');
  const [to, setTo] = useState('gb');
  const [n, setN] = useState('1024');

  const out = useMemo(() => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '';
    const map = tables[kind];
    const a = map[from];
    const b = map[to];
    if (!a || !b) return '';
    return (v * a) / b;
  }, [kind, from, to, n]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">units</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">flip sizes without leaving the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">data sizes first, plus length and mass if you need them.</p>
          <div className="flex gap-2 mb-4">
            {(['data', 'length', 'mass'] as const).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setKind(k);
                  const keys = Object.keys(tables[k]);
                  setFrom(keys[0]);
                  setTo(keys[keys.length - 1]);
                }}
                className={`px-4 py-1.5 rounded-full text-sm ${kind === k ? 'bg-white text-black' : 'bg-white/5'}`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <input value={n} onChange={(e) => setN(e.target.value)} className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none">
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none">
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{out === '' ? '—' : Number(out).toPrecision(8).replace(/\.?0+$/, '')} <span className="text-sm text-neutral-500">{to}</span></p>
        </motion.div>
      </div>
    </div>
  );
}
