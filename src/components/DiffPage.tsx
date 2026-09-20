import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function lines(s: string) {
  return s.replace(/\r\n/g, '\n').split('\n');
}

function diffRows(a: string, b: string) {
  const la = lines(a);
  const lb = lines(b);
  const max = Math.max(la.length, lb.length);
  const rows: { i: number; left: string; right: string; kind: 'same' | 'chg' | 'add' | 'del' }[] = [];
  for (let i = 0; i < max; i++) {
    const left = la[i] ?? '';
    const right = lb[i] ?? '';
    let kind: 'same' | 'chg' | 'add' | 'del' = 'same';
    if (i >= la.length) kind = 'add';
    else if (i >= lb.length) kind = 'del';
    else if (left !== right) kind = 'chg';
    rows.push({ i, left, right, kind });
  }
  return rows;
}

export default function DiffPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const rows = useMemo(() => diffRows(a, b), [a, b]);
  const changed = rows.filter((r) => r.kind !== 'same').length;

  const load = (side: 'a' | 'b') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      if (side === 'a') setA(text);
      else setB(text);
    };
    reader.readAsText(f);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">diff desk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">compare two dumps.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. paste or load two text files and see what moved. stays in this tab.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">left</span>
                <label className="text-xs text-[#0a84ff] cursor-pointer">
                  load file
                  <input type="file" className="hidden" onChange={load('a')} />
                </label>
              </div>
              <textarea value={a} onChange={(e) => setA(e.target.value)} className="w-full h-40 rounded-2xl bg-black/30 border border-white/10 p-3 text-sm outline-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">right</span>
                <label className="text-xs text-[#0a84ff] cursor-pointer">
                  load file
                  <input type="file" className="hidden" onChange={load('b')} />
                </label>
              </div>
              <textarea value={b} onChange={(e) => setB(e.target.value)} className="w-full h-40 rounded-2xl bg-black/30 border border-white/10 p-3 text-sm outline-none" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mb-3">{changed} line{changed === 1 ? '' : 's'} different</p>
          <div className="rounded-2xl overflow-hidden border border-white/8 max-h-[420px] overflow-y-auto text-[13px] font-mono">
            {rows.slice(0, 400).map((r) => (
              <div key={r.i} className={`grid grid-cols-2 gap-px ${
                r.kind === 'same' ? 'bg-white/[0.02]' : r.kind === 'add' ? 'bg-emerald-500/10' : r.kind === 'del' ? 'bg-red-500/10' : 'bg-amber-400/10'
              }`}>
                <div className="px-3 py-1 whitespace-pre-wrap break-all text-neutral-300">{r.left}</div>
                <div className="px-3 py-1 whitespace-pre-wrap break-all text-neutral-300">{r.right}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
