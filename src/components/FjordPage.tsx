import { useState } from 'react';
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
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function FjordPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{ name: string; app: string; embed: string }[]>([]);

  const onPick = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...list];
    setFiles(next);
    setLinks([]);
    setErr('');
    const fat = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(fat ? 'one of these is huge. still uploading, tab might hitch. no hard cap.' : '');
  };

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: { name: string; app: string; embed: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('could not read ' + file.name));
          r.readAsDataURL(file);
        });
        const res = await publishShare({
          id: rid(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: user?.username || note || undefined,
        });
        if (!res.ok) {
          setErr(res.error || 'could not park ' + file.name);
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || '');
        out.push({ name: file.name, app: urls.app, embed: urls.embed });
      }
      setLinks(out);
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">fjord</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">batch drop into the db</h1>
          <p className="text-sm text-neutral-500 mb-6">
            pick a pile of local files, park them in supabase, grab discord-ready links. no size lock.
          </p>

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center hover:border-white/30 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} files staged` : 'drop a stack or click'}</p>
            {files.length > 0 && (
              <ul className="mt-3 text-xs text-neutral-500 space-y-1">
                {files.slice(0, 8).map((f) => (
                  <li key={f.name + f.size}>{f.name} · {formatBytes(f.size)}</li>
                ))}
                {files.length > 8 && <li>+{files.length - 8} more</li>}
              </ul>
            )}
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional author label"
            className="mt-4 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />

          <button
            disabled={!files.length || busy}
            onClick={publish}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'parking…' : 'publish all'}
          </button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          {links.length > 0 && (
            <div className="mt-6 space-y-3">
              {links.map((l) => (
                <div key={l.embed} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-sm text-white truncate">{l.name}</p>
                  <p className="text-xs text-[#0a84ff] break-all mt-1">{l.embed}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(l.embed)}
                    className="mt-2 px-3 py-1.5 rounded-full bg-white/5 text-xs"
                  >
                    copy discord link
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
