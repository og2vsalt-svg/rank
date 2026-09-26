import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function EmberglassPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [info, setInfo] = useState<{ name: string; type: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const inspect = (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    setInfo({ name: f.name, type: f.type || 'application/octet-stream', size: f.size });
    setWarn(f.size > 40 * 1024 * 1024 ? 'glass will fog a bit. huge file, no cap.' : '');
    setErr('');
    setLink('');
    setLastId(null);
    (window as any).__emberFile = f;
  };

  const publish = async () => {
    const f: File | undefined = (window as any).__emberFile;
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      const dt = new DataTransfer();
      dt.items.add(f);
      const result = await addFiles(dt.files, 'emberglass');
      if (!result.ok) {
        setErr(result.error || 'need a session to keep this');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'inspect ok, publish missed');
        setLastId(id);
        return;
      }
      setLastId(id);
      setLink(shareUrls(id).embed);
      try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'emberglass failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">emberglass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look through the file first.</h1>
          <p className="text-neutral-400 text-sm mb-6">name, mime, weight. then publish to the db if you still want it out.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); inspect(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files)} />
            <p className="text-white font-medium">hold a file to the glass</p>
          </label>
          {info && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl bg-white/[0.04] border border-white/8 p-4 text-sm space-y-1">
              <p className="text-white truncate">{info.name}</p>
              <p className="text-neutral-500">{info.type}</p>
              <p className="text-neutral-500">{pretty(info.size)}</p>
              <button disabled={busy} onClick={publish} className="mt-3 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
                {busy ? 'warming…' : 'publish drop'}
              </button>
            </motion.div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && (
            <div className="mt-4 flex flex-wrap gap-2">
              {link && <p className="w-full text-xs text-neutral-400 break-all">embed: {link}</p>}
              <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open share</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
