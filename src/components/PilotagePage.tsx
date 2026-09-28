import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function PilotagePage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ id: string; embed: string; app: string; size: number } | null>(null);

  const onFiles = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setResult(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'this drop is large. the tab may feel slow while it encodes. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const published = await publishShare({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
        name: (name || file.name || 'drop').slice(0, 512),
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!published.ok || !published.id) {
        setErr(published.error || 'could not land the drop in the share database');
        return;
      }
      if (published.warn) setWarn(published.warn);
      const urls = shareUrls(published.id);
      setResult({ id: published.id, embed: urls.embed, app: urls.app, size: file.size });
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'pilotage failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">pilotage</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">steer a local file into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            this desk is not a vault grid. pick one file on this machine, optionally name it, and we publish it as a public drop with a discord card at /s.
          </p>
          <div className="space-y-3 mb-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="optional public name"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="optional author tag"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition"
            />
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop one file, or click to choose'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400">published {formatBytes(result.size)}. discord link copied.</p>
              <p className="text-xs text-neutral-500 break-all">{result.embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', result.id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open share</button>
                <button
                  onClick={async () => { try { await navigator.clipboard.writeText(result.embed); } catch {} }}
                  className="px-5 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition"
                >
                  copy /s card
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
