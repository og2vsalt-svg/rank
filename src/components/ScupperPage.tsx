import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function ScupperPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files
      .map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type || 'unknown',
        ext: (f.name.split('.').pop() || '').toLowerCase(),
        modified: f.lastModified,
      }))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.ext.includes(q) || r.type.includes(q));
  }, [files, query]);

  const total = files.reduce((a, f) => a + f.size, 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">scupper</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drain a folder into a readable list.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            nothing leaves the tab. drop many locals, filter them, see types and sizes. no cap — a huge pile may just feel slow.
          </p>
          <label className="block mb-4">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles([...(e.target.files || [])])} />
            <span className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">pick files</span>
          </label>
          {files.length > 0 && (
            <>
              <p className="text-xs text-neutral-500 mb-3">{files.length} files · {pretty(total)}</p>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="filter by name, type, or extension" className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
              <div className="space-y-1.5 max-h-[28rem] overflow-auto pr-1">
                {rows.map((r) => (
                  <div key={r.name + r.modified} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{r.name}</p>
                      <p className="text-[11px] text-neutral-500">{r.ext || 'file'} · {r.type}</p>
                    </div>
                    <p className="text-xs text-neutral-400 shrink-0">{pretty(r.size)}</p>
                  </div>
                ))}
                {!rows.length && <p className="text-sm text-neutral-500">nothing matches.</p>}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
