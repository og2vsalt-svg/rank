import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

type Side = { name: string; size: number; type: string } | null;

export default function TrestlePage() {
  const [left, setLeft] = useState<Side>(null);
  const [right, setRight] = useState<Side>(null);

  const pick = (which: 'left' | 'right', file?: File) => {
    if (!file) return;
    const row = { name: file.name, size: file.size, type: file.type || 'application/octet-stream' };
    if (which === 'left') setLeft(row);
    else setRight(row);
  };

  const note = useMemo(() => {
    if (!left || !right) return 'two local files. nothing uploads.';
    if (left.size === right.size) return 'same weight. names still differ.';
    return left.size > right.size
      ? `${left.name} sits heavier by ${pretty(left.size - right.size)}.`
      : `${right.name} sits heavier by ${pretty(right.size - left.size)}.`;
  }, [left, right]);

  const warn = (left && left.size > 40 * 1024 * 1024) || (right && right.size > 40 * 1024 * 1024)
    ? 'no cap. big locals can just make the picker feel slow.'
    : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-[#0a84ff] text-sm mb-2">trestle</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">lay two locals across a beam.</h1>
          <p className="text-neutral-400 text-sm mb-8">a scale, not a vault. compare name and size in this tab. nothing is written to the share db.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {(['left', 'right'] as const).map((side) => {
              const row = side === 'left' ? left : right;
              return (
                <label
                  key={side}
                  className="glass rounded-[28px] p-6 cursor-pointer hover:-translate-y-0.5 transition"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pick(side, e.dataTransfer.files?.[0]); }}
                >
                  <input type="file" className="hidden" onChange={(e) => pick(side, e.target.files?.[0] || undefined)} />
                  <p className="text-xs text-neutral-500 mb-2">{side} pier</p>
                  {row ? (
                    <>
                      <p className="text-white font-medium break-all">{row.name}</p>
                      <p className="text-sm text-neutral-400 mt-2">{pretty(row.size)}</p>
                      <p className="text-xs text-neutral-600 mt-1">{row.type}</p>
                    </>
                  ) : (
                    <p className="text-neutral-400 text-sm">drop a file here</p>
                  )}
                </label>
              );
            })}
          </div>
          <p className="text-sm text-neutral-300 mt-6">{note}</p>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
        </motion.div>
      </main>
    </div>
  );
}
