import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

function prettySize(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function AegisPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<any>(null);

  const urls = id.trim() ? shareUrls(id.trim()) : null;

  const card = useMemo(() => {
    if (!meta) return null;
    return {
      title: meta.name || 'rankvault drop',
      desc: `${meta.type || 'file'} · ${prettySize(Number(meta.size) || 0)}${meta.author ? ' · ' + meta.author : ''} · public drop on rankvault`,
      image: String(meta.type || '').startsWith('image/') ? meta.url : null,
    };
  }, [meta]);

  const peek = async () => {
    setErr('');
    setMeta(null);
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    try {
      const row = await fetchShare(clean);
      if (!row) setErr('no public share with that id.');
      else setMeta(row);
    } catch (e: any) {
      setErr(e?.message || 'lookup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">aegis</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a vault. this desk pulls a public share and shows the og title discord would unfurl from /s/id.</p>
          <div className="flex gap-2 mb-5">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={peek} disabled={busy} className="px-4 py-3 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? '...' : 'peek'}</button>
          </div>
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          {urls && (
            <div className="rounded-2xl bg-white/5 p-4 mb-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">embed url</p>
              <p className="text-sm break-all text-neutral-200">{urls.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(urls.embed)} className="mt-3 px-4 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy</button>
            </div>
          )}
          {card && (
            <div className="rounded-2xl overflow-hidden border border-white/10">
              {card.image && <img src={card.image} alt="" className="w-full h-40 object-cover" />}
              <div className="p-4 bg-[#111214]">
                <p className="text-[11px] text-[#00a8fc] mb-1">rankvault</p>
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="text-xs text-neutral-400 mt-1">{card.desc}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-neutral-500 mt-5">big files still share. you just get a slowness warning, no cap.</p>
        </motion.div>
      </div>
    </div>
  );
}
