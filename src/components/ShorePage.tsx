import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ShorePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{ name: string; embed: string; app: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const weight = files.reduce((s, f) => s + f.size, 0);
    setWarn(weight > 20 * 1024 * 1024 ? 'big pile. upload still goes through, tab may feel sleepy.' : '');
    setErr('');
    setBusy(true);
    const next: { name: string; embed: string; app: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await readFile(file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          setErr(res.error || 'upload missed the db');
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, embed: urls.embed, app: urls.app });
      }
      setLinks(next);
    } catch (e: any) {
      setErr(e?.message || 'could not read file');
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
          <p className="text-[#0a84ff] text-sm mb-2">shore</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop local files into the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            picks a file from your machine, writes it to the share db, hands back a discord-ready /s/ link. no hard size cap.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'uploading…' : 'choose files'}</p>
            <p className="text-xs text-neutral-500 mt-2">huge files just warn about slowness.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {links.length > 0 && (
            <ul className="mt-6 space-y-3">
              {links.map((l) => (
                <li key={l.embed} className="rounded-2xl bg-white/[0.03] border border-white/8 p-4">
                  <p className="text-sm text-white truncate">{l.name}</p>
                  <p className="text-[11px] text-neutral-500 break-all mt-1">{l.embed}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(l.embed)}
                      className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                    >
                      copy embed
                    </button>
                    <a href={l.app} className="px-3 py-1.5 rounded-full bg-white/5 text-xs">open</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-neutral-600 mt-6">{links.length ? `${links.length} live` : 'waiting'} · {formatBytes(0)} placeholder</p>
        </motion.div>
      </div>
    </div>
  );
}
