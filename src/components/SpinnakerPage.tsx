import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function SpinnakerPage() {
  const [id, setId] = useState('');
  const [pack, setPack] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const build = async () => {
    const clean = id.trim().replace(/^.*[/=]/, '');
    if (!clean) return;
    setBusy(true);
    setErr('');
    setPack('');
    try {
      const meta = await fetchShare(clean);
      const urls = shareUrls(clean);
      const name = meta?.name || clean;
      const lines = [
        `rankvault drop — ${name}`,
        '',
        `open:  ${urls.app}`,
        `card:  ${urls.embed}`,
        `file:  ${urls.file}`,
        '',
        'discord paste the card link. crawlers get og + twitter tags, humans bounce into the app.',
        meta ? `${meta.type} · ${meta.size} bytes` : 'share id not in the db yet — card still works once published.',
      ];
      setPack(lines.join('\n'));
    } catch (e: any) {
      setErr(e?.message || 'could not pack this id');
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
          <p className="text-[#0a84ff] text-sm mb-2">spinnaker</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pack a drop into a share sheet.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. paste a share id and get the discord card, app hash, and file path in one breath.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id or /s/… link"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button onClick={build} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'packing…' : 'pack'}
            </button>
          </div>
          {err && <p className="text-sm text-red-400 mb-3">{err}</p>}
          {pack && (
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap bg-black/30 rounded-2xl p-4">{pack}</pre>
          )}
        </motion.div>
      </div>
    </div>
  );
}
