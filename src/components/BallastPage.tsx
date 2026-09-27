import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

async function digest(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type Info = { name: string; size: number; type: string; sha: string; head: string };

async function inspect(file: File): Promise<Info> {
  const buf = await file.arrayBuffer();
  const slice = new Uint8Array(buf.slice(0, 24));
  const head = Array.from(slice).map((b) => b.toString(16).padStart(2, '0')).join(' ');
  return { name: file.name, size: file.size, type: file.type || 'unknown', sha: await digest(buf), head };
}

export default function BallastPage() {
  const [a, setA] = useState<Info | null>(null);
  const [b, setB] = useState<Info | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const onPick = async (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setBusy(true);
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. hashing still runs, just may hitch. no hard limit.' : '');
    try {
      const info = await inspect(f);
      if (which === 'a') setA(info);
      else setB(info);
    } finally {
      setBusy(false);
    }
  };

  const same = a && b && a.sha === b.sha;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ballast</p>
          <h1 className="text-3xl font-semibold mb-3">weigh two files against each other.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. sha-256 plus the first bytes. nothing leaves this tab.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((slot) => (
              <label key={slot} className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
                <input type="file" className="hidden" onChange={(e) => onPick(slot, e.target.files)} />
                <p className="text-white font-medium">{busy ? 'reading…' : `drop file ${slot}`}</p>
                <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness ping if it is huge.</p>
              </label>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {(a || b) && (
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              {[a, b].map((info, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/8 p-4">
                  {info ? (
                    <>
                      <p className="text-white truncate">{info.name}</p>
                      <p className="text-neutral-500 text-xs mt-1">{formatBytes(info.size)} · {info.type}</p>
                      <p className="text-[11px] text-neutral-500 mt-3 break-all font-mono">{info.sha}</p>
                      <p className="text-[11px] text-neutral-600 mt-2 font-mono">{info.head}</p>
                    </>
                  ) : (
                    <p className="text-neutral-600">waiting</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {a && b && (
            <p className={`mt-5 text-sm ${same ? 'text-emerald-300' : 'text-amber-200'}`}>
              {same ? 'same payload. ballast matches.' : 'different bytes. these are not twins.'}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
