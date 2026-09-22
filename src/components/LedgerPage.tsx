import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function fmt(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function LedgerPage() {
  const { files, usedBytes, ready } = useVault();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return files.filter((f) => {
      if (kind === 'public' && !f.public) return false;
      if (kind === 'starred' && !f.starred) return false;
      if (kind === 'image' && !f.type.startsWith('image/')) return false;
      if (needle && !(`${f.name} ${f.folder} ${f.tags.join(' ')} ${f.note}`).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [files, q, kind]);

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
          <p className="text-[#0a84ff] text-sm mb-2">ledger</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">every file, searchable.</h1>
          <p className="text-neutral-400 text-sm mb-2">not the vault grid. a quiet index. no size cap — big files just get a slowness warning elsewhere.</p>
          <p className="text-xs text-neutral-600 mb-6">{ready ? `${files.length} files · ${fmt(usedBytes)}` : 'loading…'}</p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search name, tag, folder, note"
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mb-6">
            {['all', 'public', 'starred', 'image'].map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${kind === k ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}
              >
                {k}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500">nothing matches. log in and drop files in the vault first.</p>
          ) : (
            <ul className="space-y-2">
              {rows.slice(0, 80).map((f) => (
                <li key={f.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{f.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{fmt(f.size)} · {f.folder}{f.public ? ' · public' : ''}{f.starred ? ' · starred' : ''}</p>
                    </div>
                    <button onClick={() => navigate('vault')} className="text-xs px-3 py-1.5 rounded-full bg-white/5 shrink-0">vault</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
