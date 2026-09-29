import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function TaffrailPage() {
  const [raw, setRaw] = useState('');
  const [rows, setRows] = useState<{ k: string; v: string }[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const inspect = async () => {
    const id = raw.trim().split(/[/?#=&]/).filter(Boolean).pop() || '';
    if (!id) return;
    setBusy(true);
    setErr('');
    setRows([]);
    try {
      const meta = await fetchShare(id);
      const urls = shareUrls(id);
      const next = [
        { k: 'id', v: id },
        { k: 'discord card', v: urls.embed },
        { k: 'app hash', v: urls.app },
        { k: 'name', v: meta?.name || 'not in db yet' },
        { k: 'type', v: meta?.type || '—' },
        { k: 'size', v: meta ? String(meta.size) : '—' },
        { k: 'expires', v: meta?.expiresAt || 'none' },
        { k: 'opens', v: meta ? String(meta.downloads || 0) : '—' },
        { k: 'og:title', v: meta?.name || 'rankvault drop' },
        { k: 'og:site_name', v: 'rankvault' },
        { k: 'theme-color', v: '#0A84FF' },
      ];
      setRows(next);
    } catch (e: any) {
      setErr(e?.message || 'inspect failed');
    } finally {
      setBusy(false);
    }
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">taffrail</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look over the stern at a card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspect what discord will read. no upload here — just the metadata we stamp on every /s/ link.
          </p>
          <div className="flex gap-2 mb-5">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="id or embed url"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button onClick={inspect} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'reading…' : 'inspect'}
            </button>
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.k} className="flex gap-3 text-sm">
                <span className="text-neutral-500 w-32 shrink-0">{r.k}</span>
                <span className="text-neutral-200 break-all">{r.v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
