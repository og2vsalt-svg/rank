import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function ValePage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{ name: string; embed: string; app: string }[]>([]);

  const onPick = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    const chunky = next.some((f) => f.size > 20 * 1024 * 1024);
    setWarn(chunky ? 'one of these is heavy. publish still runs, tab might nap for a sec. no cap.' : '');
    setErr('');
  };

  const publishAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: { name: string; embed: string; app: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('could not read ' + file.name));
          r.readAsDataURL(file);
        });
        const id = rid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: user?.username,
        });
        if (!res.ok) {
          setErr(res.error || 'one file stalled');
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || id);
        out.push({ name: file.name, embed: urls.embed, app: urls.app });
      }
      setLinks(out);
    } catch (e: any) {
      setErr(e?.message || 'batch failed');
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
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">vale</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">batch drop a whole folder vibe</h1>
          <p className="text-sm text-neutral-500 mb-6">
            pick a pile of local files, park each one in the db, get discord-ready links back. vault stays where it is.
          </p>

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center hover:border-white/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            <p className="text-white text-sm">{files.length ? files.length + ' files staged' : 'drop a handful'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. slowness warning only.</p>
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-neutral-400">
              {files.slice(0, 12).map((f) => (
                <li key={f.name + f.size}>{f.name} · {formatBytes(f.size)}</li>
              ))}
              {files.length > 12 && <li>+{files.length - 12} more</li>}
            </ul>
          )}

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}

          <button
            disabled={!files.length || busy}
            onClick={publishAll}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'publishing…' : 'publish all to db'}
          </button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          {links.length > 0 && (
            <div className="mt-6 space-y-3">
              {links.map((l) => (
                <div key={l.embed} className="rounded-2xl bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-sm text-white truncate">{l.name}</p>
                  <p className="text-xs text-[#0a84ff] break-all mt-1">{l.embed}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
