import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function RelicPage() {
  const { addFiles } = useVault();
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('72');
  const [status, setStatus] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const onPick = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const heavy = files.find((f) => f.size > 12 * 1024 * 1024);
    setWarn(heavy ? `${heavy.name} is heavy. no cap, but this tab might drag.` : '');
    setBusy(true);
    setStatus('keeping a local copy…');
    try {
      await addFiles(files);
      const first = files[0];
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(first);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const hrs = Math.max(1, Number(hours) || 72);
      const expiresAt = new Date(Date.now() + hrs * 3600 * 1000).toISOString();
      setStatus('burying it in the share table…');
      const res = await publishShare({
        id,
        name: first.name,
        type: first.type || 'application/octet-stream',
        size: first.size,
        dataUrl,
        expiresAt,
        author: note.trim() ? `relic:${note.trim().slice(0, 80)}` : 'relic',
      });
      if (!res.ok) {
        setStatus(res.error || 'cloud said no. still sitting in your vault.');
      } else {
        const urls = shareUrls(res.id || id);
        setLink(urls.embed);
        setStatus(`${first.name} · ${formatBytes(first.size)} · fades in ${hrs}h`);
        if (res.warn) setWarn(res.warn);
      }
    } catch (e: any) {
      setStatus((e && e.message) || 'could not read that file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">relic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">time capsule drop</h1>
          <p className="text-sm text-neutral-500 mb-8">upload a local file, park it in the public table, and let it expire on its own. discord embeds look like a real drop.</p>
          <label className="block text-xs text-neutral-500 mb-1">note on the drop</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional whisper" className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block text-xs text-neutral-500 mb-1">fade after (hours)</label>
          <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-full mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className={`block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center cursor-pointer ${busy ? 'opacity-50' : 'hover:border-white/30'} transition-colors`}>
            <input type="file" className="hidden" disabled={busy} onChange={(e) => onPick(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'working…' : 'drop a file or tap to pick'}</span>
          </label>
          {warn && <p className="text-xs text-amber-400/90 mt-4">{warn}</p>}
          {status && <p className="text-sm text-neutral-400 mt-4">{status}</p>}
          {link && (
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={link} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" target="_blank" rel="noreferrer">open embed</a>
              <button onClick={() => navigator.clipboard.writeText(link)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">copy discord link</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
