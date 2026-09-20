import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function BeaconPage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function publish() {
    setBusy(true);
    setErr(null);
    try {
      const body = JSON.stringify({ name: name.trim() || 'anon', note: note.trim(), at: Date.now() });
      const blob = new Blob([body], { type: 'application/json' });
      const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: `${(name.trim() || 'beacon').slice(0, 40)}.json`,
        type: 'application/json',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not light the beacon');
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
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">beacon</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">presence card</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">not a vault. a tiny public card that discord can unfurl.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="who is this"
              className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a quiet note"
              rows={5}
              className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10 resize-none"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={busy}
              className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5"
            >
              {busy ? 'lighting…' : 'publish beacon'}
            </motion.button>
          </motion.div>
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && (
            <div className="mt-6 glass rounded-3xl p-5">
              <p className="text-xs text-neutral-500 mb-2">discord-ready link</p>
              <p className="text-sm break-all text-white">{link}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
