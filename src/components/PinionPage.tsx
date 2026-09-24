import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function PinionPage() {
  const [raw, setRaw] = useState('');
  const [out, setOut] = useState<{ embed: string; app: string; name: string } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const polish = async () => {
    const id = raw.trim().replace(/^.*(?:f=|\/s\/|\/f\/|\/share\/)/, '').replace(/[^a-z0-9_-]/gi, '');
    if (!id) {
      setErr('need a share id or messy link');
      return;
    }
    setBusy(true);
    setErr('');
    const meta = await fetchShare(id);
    setBusy(false);
    if (!meta) {
      setErr('that id is not live in the db');
      setOut(null);
      return;
    }
    setOut({ ...shareUrls(id), name: meta.name });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">pinion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">make the discord link look clean</h1>
          <p className="text-sm text-neutral-500 mb-6">paste any share hash. we spit the /s/ embed url bots actually unfurl.</p>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="#share?f=… or just the id"
            className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <button
            onClick={polish}
            disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'checking…' : 'polish'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {out && (
            <div className="mt-5 space-y-2 text-sm">
              <p className="text-white">{out.name}</p>
              <p className="text-xs text-neutral-500">paste this in discord</p>
              <p className="break-all text-[#0a84ff]">{out.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(out.embed)} className="px-4 py-2 rounded-full bg-white/5 text-sm">copy embed</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
