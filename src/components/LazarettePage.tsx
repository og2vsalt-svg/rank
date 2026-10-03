import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LazarettePage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<CloudMeta | null>(null);

  useEffect(() => {
    listPublicShares(36).then((list) => {
      setRows(list.filter((row) => String(row.type || '').startsWith('image/') && /^https?:/i.test(row.url || '')));
    }).catch(() => setErr('the share table did not answer'));
  }, []);

  const copy = async (id: string) => {
    const link = shareUrls(id).embed;
    try { await navigator.clipboard.writeText(link); } catch { setErr(link); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">lazarette</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">pictures already on the table.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a look through public image drops. this is not the vault drawer. paste a card link in Discord and it unfurls.</p>
        </motion.div>
        {err && <p className="text-sm text-red-300 mb-4">{err}</p>}
        {rows.length === 0 && !err && <p className="text-sm text-neutral-500">no public images yet. file one from forepeak.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.map((row, i) => (
            <motion.button key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onClick={() => setOpen(row)} className="glass rounded-2xl overflow-hidden text-left hover:-translate-y-0.5 transition">
              <img src={row.url} alt="" className="h-36 w-full object-cover bg-black/40" />
              <div className="p-3">
                <p className="text-sm text-white truncate">{row.name}</p>
                <p className="text-[11px] text-neutral-500">{pretty(row.size || 0)}</p>
              </div>
            </motion.button>
          ))}
        </div>
        {open && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setOpen(null)}>
            <div className="glass rounded-3xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img src={open.url} alt="" className="w-full max-h-[50vh] object-contain bg-black" />
              <div className="p-4">
                <p className="text-white font-medium">{open.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{open.author || 'public drop'}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => copy(open.id)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
                  <button onClick={() => setOpen(null)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
