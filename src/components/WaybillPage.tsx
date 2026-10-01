import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function WaybillPage() {
  const [id, setId] = useState('');
  const [meta, setMeta] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const look = async () => {
    setBusy(true);
    setErr('');
    setMeta(null);
    const clean = id.trim().replace(/^.*\/s\//, '').replace(/[?#].*$/, '');
    const row = await fetchShare(clean);
    setBusy(false);
    if (!row) {
      setErr('no public row for that id');
      return;
    }
    setMeta(row);
    setId(clean);
  };

  const urls = meta ? shareUrls(meta.id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">waybill</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">read a drop, copy its card</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Paste a share id or a /s link. This looks up the database row and lists the Discord-facing urls.</p>
        </motion.div>
        <div className="mt-8 flex gap-2">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or /s/… link" className="glass flex-1 rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <button onClick={look} className="rounded-full bg-[#0A84FF] px-4 text-[14px] font-medium">{busy ? '…' : 'look up'}</button>
        </div>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {meta && urls && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[17px] font-medium tracking-tight">{meta.name}</p>
            <p className="mt-1 text-[13px] text-white/50">{meta.type} · {meta.size} bytes · {meta.downloads || 0} opens</p>
            <ul className="mt-4 space-y-2 text-[13px] text-white/75">
              <li className="break-all">card {urls.embed}</li>
              <li className="break-all">file route {urls.file}</li>
              <li className="break-all">open {urls.open}</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
