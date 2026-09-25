import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function WardenPage() {
  const [raw, setRaw] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);

  const inspect = async () => {
    const id = raw.replace(/^.*[?&]f=/, '').replace(/^.*\/(s|f|d|g|share)\//, '').replace(/[^a-zA-Z0-9_-].*$/, '').trim() || raw.trim();
    if (!id) return;
    setBusy(true);
    setOut('');
    try {
      const meta = await fetchShare(id);
      if (!meta) {
        setOut('nothing in the cloud db for that id. maybe it is local-only or expired.');
        return;
      }
      const urls = shareUrls(meta.id);
      setOut(
        [
          `name: ${meta.name}`,
          `type: ${meta.type || 'unknown'}`,
          `size: ${meta.size} bytes`,
          `author: ${meta.author || '—'}`,
          `expires: ${meta.expiresAt || 'never'}`,
          `downloads: ${meta.downloads ?? 0}`,
          `app: ${urls.app}`,
          `discord embed: ${urls.embed}`,
        ].join('\n'),
      );
    } catch (e: any) {
      setOut(e?.message || 'lookup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">warden</p>
          <h1 className="text-3xl font-semibold mb-3">inspect a share without opening it.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste an app link, embed url, or raw id. we hit the same db your drops write to.</p>
          <div className="flex gap-2">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="id or https://…/s/…"
              className="flex-1 bg-white/5 rounded-full px-4 py-2.5 outline-none text-sm"
            />
            <button onClick={inspect} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'looking…' : 'inspect'}
            </button>
          </div>
          {out && <pre className="mt-6 text-xs text-neutral-300 bg-black/30 rounded-2xl p-4 whitespace-pre-wrap break-all">{out}</pre>}
        </motion.div>
      </div>
    </div>
  );
}
