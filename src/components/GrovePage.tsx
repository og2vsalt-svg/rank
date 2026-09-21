import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function GrovePage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{ name: string; embed: string; app: string }[]>([]);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles(next);
    setLinks([]);
    setErr('');
    const total = next.reduce((a, f) => a + f.size, 0);
    setWarn(total > 8 * 1024 * 1024 ? 'chunky pack. still going, tab might lag. no hard cap.' : '');
  };

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: { name: string; embed: string; app: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
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
          setErr(res.error || 'one file missed the db');
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || id);
        out.push({ name: file.name, embed: urls.embed, app: urls.app });
      }
      setLinks(out);
    } catch (e: any) {
      setErr(e?.message || 'pack failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">grove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">plant a pack of files</h1>
          <p className="text-sm text-neutral-500 mb-6">
            multi-file drop into the share db. each file gets its own discord embed link.
          </p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-sm text-neutral-400 hover:border-white/30 hover:text-white"
          >
            {files.length ? `${files.length} files · ${formatBytes(files.reduce((a, f) => a + f.size, 0))}` : 'pick a handful from this machine'}
          </button>
          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-neutral-500">
              {files.map((f) => (
                <li key={f.name + f.size}>{f.name} · {formatBytes(f.size)}</li>
              ))}
            </ul>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <button
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'planting…' : 'publish pack'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {links.length > 0 && (
            <div className="mt-6 space-y-3">
              {links.map((l) => (
                <div key={l.embed} className="rounded-2xl bg-black/30 px-4 py-3">
                  <p className="text-sm text-white">{l.name}</p>
                  <p className="text-xs text-[#0a84ff] break-all mt-1">{l.embed}</p>
                  <button onClick={() => navigator.clipboard.writeText(l.embed)} className="mt-2 text-xs text-neutral-400">copy discord link</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
