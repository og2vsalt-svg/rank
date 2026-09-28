import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function RivetPage() {
  const { addFiles, togglePublic } = useVault();
  const [items, setItems] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...items, ...list];
    setItems(next);
    const total = next.reduce((n, f) => n + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'bundle is chunky. riveting may hitch. no hard limit.' : '');
  };

  const rivet = async () => {
    if (!items.length) return;
    setBusy(true); setErr(''); setLink('');
    try {
      const parts = await Promise.all(items.map(async (f) => ({
        name: f.name, type: f.type || 'application/octet-stream', size: f.size,
        data: await f.arrayBuffer().then((b) => {
          const u = new Uint8Array(b);
          let s = '';
          for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
          return btoa(s);
        }),
      })));
      const payload = JSON.stringify({ kind: 'rivet-bundle', files: parts }, null, 2);
      const file = new File([payload], 'rivet-bundle.json', { type: 'application/json' });
      const result = await addFiles([file], 'drops');
      if (!result.ok || !result.ids?.[0]) { setErr(result.error || 'could not save bundle'); return; }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) { setErr(pub.error || 'saved locally, publish missed'); return; }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.card);
      try { await navigator.clipboard.writeText(urls.card); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'rivet failed');
    } finally {
      setBusy(false);
    }
  };

  const total = items.reduce((n, f) => n + f.size, 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">rivet</p>
          <h1 className="text-3xl font-semibold mb-3">pin several files into one public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a zip tool — a json bundle that lives on the same share table. one discord card for the set.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-white font-medium">add pieces</p>
            <p className="text-xs text-neutral-500 mt-2">{items.length} waiting · {pretty(total)}</p>
          </label>
          <ul className="space-y-1 mb-4">
            {items.map((f, i) => (
              <li key={i} className="text-sm text-neutral-300 flex justify-between">
                <span className="truncate">{f.name}</span>
                <button className="text-neutral-500 text-xs" onClick={() => setItems(items.filter((_, j) => j !== i))}>remove</button>
              </li>
            ))}
          </ul>
          <button onClick={rivet} disabled={busy || !items.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'riveting…' : 'publish bundle'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">card link copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
