import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function QuayPage() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function pack() {
    const ids = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      setErr('drop at least one share id or /s/ url');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = JSON.stringify({ kind: 'quay', ids: ids.map((s) => s.replace(/.*\//, '').replace(/.*f=/, '')), at: Date.now() });
      const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(payload)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: 'quay-pack.json',
        type: 'application/json',
        size: payload.length,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not pack');
        return;
      }
      setLink(shareUrls(res.id || id).embed);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">quay</p>
          <h1 className="text-3xl font-semibold tracking-tight">bundle share ids</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">not a vault. paste a handful of /s links and we park a json pack in the share db so discord can unfurl one card.</p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-4">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="paste share ids or /s/ urls, one per line"
              rows={6}
              className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10 resize-none"
            />
            <motion.button whileTap={{ scale: 0.98 }} onClick={pack} disabled={busy} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">
              {busy ? 'packing…' : 'publish pack'}
            </motion.button>
          </motion.div>
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && (
            <div className="mt-6 glass rounded-3xl p-5">
              <p className="text-xs text-neutral-500 mb-2">discord-ready pack</p>
              <p className="text-sm break-all text-white">{link}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
