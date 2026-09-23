import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function BraidPage() {
  const { navigate } = useRouter();
  const [ids, setIds] = useState('');
  const [pack, setPack] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const wanted = ids.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      const all = await listPublicShares(80);
      const picked = wanted.length
        ? all.filter((r) => wanted.includes(r.id) || wanted.some((w) => r.name.toLowerCase().includes(w.toLowerCase())))
        : all.slice(0, 8);
      setPack(picked);
      if (!picked.length) setErr('nothing in the public table matched that braid.');
    } catch (e: any) {
      setErr(e?.message || 'could not braid shares');
    } finally {
      setBusy(false);
    }
  };

  const copyList = async () => {
    const lines = pack.map((p) => shareUrls(p.id).embed).join('\n');
    try { await navigator.clipboard.writeText(lines); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">braid</p>
          <h1 className="text-3xl font-semibold mb-3">stitch public drops into one list.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault clone. paste share ids or names, pull live rows from the db, copy discord-ready links as a pack.</p>
          <textarea value={ids} onChange={(e) => setIds(e.target.value)} placeholder="ids or names, one per line" className="w-full min-h-[120px] mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y" />
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={load} disabled={busy} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-sm text-white disabled:opacity-50">{busy ? 'pulling…' : 'braid from db'}</button>
            <button onClick={copyList} disabled={!pack.length} className="px-5 py-2.5 rounded-full bg-white/8 text-sm disabled:opacity-40">copy embed pack</button>
          </div>
          {err && <p className="text-amber-300/90 text-sm mb-4">{err}</p>}
          <ul className="space-y-2">
            {pack.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{p.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{p.type} · {Math.max(1, Math.round(p.size / 1024))} kb</p>
                </div>
                <button onClick={() => navigate('share', p.id)} className="shrink-0 text-xs text-[#0a84ff]">open</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
