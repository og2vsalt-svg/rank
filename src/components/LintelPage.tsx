import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function sanitize(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const base = parts.join('.')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase() || 'file';
  return base + ext.toLowerCase();
}

export default function LintelPage() {
  const [rows, setRows] = useState<{ from: string; to: string; size: number }[]>([]);
  const [copied, setCopied] = useState(false);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lintel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">clean names before you drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">local rename planner. no upload, no cap. just a tidy map of what the files would be called.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setRows(files.map((f) => ({ from: f.name, to: sanitize(f.name), size: f.size })));
              }}
            />
            <span className="text-sm text-neutral-300">pick a pile of files</span>
          </label>
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <div key={r.from} className="rounded-2xl bg-black/25 px-4 py-3">
                  <p className="text-xs text-neutral-500 truncate">{r.from}</p>
                  <p className="text-sm text-white truncate">{r.to}</p>
                </div>
              ))}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(rows.map((r) => `${r.from}\t${r.to}`).join('\n'));
                  setCopied(true);
                }}
                className="mt-3 px-4 py-2 rounded-full bg-white text-black text-xs font-medium"
              >
                {copied ? 'copied map' : 'copy rename map'}
              </button>
              {rows.some((r) => r.size > 40 * 1024 * 1024) && (
                <p className="text-amber-300/80 text-xs">some of these are chunky. hosting still works, just warn the other side it might feel slow.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
