import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function DriftnetPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [armed, setArmed] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [lastId, setLastId] = useState<string | null>(null);
  const [warn, setWarn] = useState('');

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (!armed) return;
      const items = e.clipboardData?.files;
      if (!items?.length) {
        const text = e.clipboardData?.getData('text');
        if (text) setLog((l) => [`caught text (${text.length} chars) — drop a file instead`, ...l].slice(0, 6));
        return;
      }
      const f = items[0];
      setWarn(f.size > 40 * 1024 * 1024 ? 'net sagged. huge catch, still no cap.' : '');
      const result = await addFiles(items, 'driftnet');
      if (!result.ok) {
        setLog((l) => [result.error || 'missed the catch', ...l].slice(0, 6));
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      setLastId(id);
      const urls = shareUrls(id);
      setLog((l) => [`${f.name} → ${pub.ok ? urls.embed : 'local only'}`, ...l].slice(0, 6));
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [armed, addFiles, togglePublic]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">driftnet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paste a file. net it.</h1>
          <p className="text-neutral-400 text-sm mb-6">leave this tab focused, copy a file, paste. it hits the vault then the public db.</p>
          <button
            onClick={() => setArmed(!armed)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
              armed ? 'bg-white text-black' : 'bg-white/10 text-neutral-300'
            }`}
          >
            {armed ? 'net is open' : 'net is folded'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <ul className="mt-6 space-y-2 text-sm text-neutral-400">
            {log.map((row, i) => (
              <li key={i} className="truncate">{row}</li>
            ))}
            {!log.length && <li className="text-neutral-600">waiting for a paste…</li>}
          </ul>
          {lastId && (
            <button onClick={() => navigate('share', lastId)} className="mt-6 px-5 py-2.5 rounded-full bg-white/5 text-sm">open last catch</button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
