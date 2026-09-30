import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Sight = { label: string; value: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function hashFile(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SextantPage() {
  const [sights, setSights] = useState<Sight[]>([]);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const sight = async (file: File | null) => {
    setErr('');
    setSights([]);
    if (!file) return;
    setWarn(file.size > 40 * 1024 * 1024 ? 'large sight. hashing may stall the tab. no cap.' : '');
    setBusy(true);
    try {
      const rows: Sight[] = [
        { label: 'name', value: file.name },
        { label: 'type', value: file.type || 'unknown' },
        { label: 'size', value: pretty(file.size) + ' (' + file.size + ')' },
        { label: 'modified', value: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—' },
      ];
      try {
        rows.push({ label: 'sha-256', value: await hashFile(file) });
      } catch {
        rows.push({ label: 'sha-256', value: 'unavailable in this browser' });
      }
      setSights(rows);
    } catch (e: any) {
      setErr(e?.message || 'could not take the sight');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">sextant</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">take a sight of a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">reads name, type, weight, and a sha-256 in the tab. nothing is sent. useful before you decide whether a drop is worth publishing.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => sight(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{busy ? 'taking the sight…' : 'choose a file to inspect'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <div className="space-y-2">
            {sights.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">{s.label}</p>
                <p className="text-sm text-neutral-200 break-all font-mono">{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
