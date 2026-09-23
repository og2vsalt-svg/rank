import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function LocketPage() {
  const { addFiles } = useVault();
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const sleepyNote = useMemo(() => warn, [warn]);

  const onPick = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const heavy = files.find((f) => f.size > 12 * 1024 * 1024);
    if (heavy) setWarn(`${heavy.name} is chunky. no limit, but this tab might crawl while it uploads.`);
    else setWarn('');
    setBusy(true);
    setStatus('stashing locally…');
    try {
      await addFiles(files);
      const first = files[0];
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(first);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      setStatus('publishing to the share table…');
      const res = await publishShare({
        id,
        name: first.name,
        type: first.type || 'application/octet-stream',
        size: first.size,
        dataUrl,
        lockPass: pass || undefined,
        author: 'locket',
      });
      if (!res.ok) {
        setStatus(res.error || 'cloud said no. file is still in your local vault.');
      } else {
        const urls = shareUrls(res.id || id);
        setLink(urls.embed);
        setStatus('live as ' + first.name + ' · ' + formatBytes(first.size));
        if (res.warn) setWarn(res.warn);
      }
    } catch (e) {
      setStatus((e && e.message) || 'could not read that file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">locket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lock and send</h1>
          <p className="text-sm text-neutral-500 mb-6">upload a local file, optional passcode, lands in supabase. discord links use /s/id so previews look clean.</p>
          <label className="block text-xs text-neutral-500 mb-1">passcode (optional)</label>
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="leave empty for open drop" className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block">
            <input type="file" className="hidden" disabled={busy} onChange={(e) => onPick(e.target.files)} />
            <span className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">{busy ? 'working…' : 'choose a file'}</span>
          </label>
          {sleepyNote && <p className="text-xs text-amber-300/90 mt-5">{sleepyNote}</p>}
          {status && <p className="text-sm text-neutral-300 mt-5">{status}</p>}
          {link && (
            <p className="text-xs text-neutral-500 mt-3 break-all">discord embed: {link}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
