import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function MeadowPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; id: string; embed: string; app: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(chunky ? 'some of these are huge. encoding might make the tab sleepy. still no cap.' : '');
    setErr('');
    setBusy(true);
    const next: { name: string; id: string; embed: string; app: string }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          setErr(res.error || `failed on ${file.name}`);
          continue;
        }
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, id: res.id || id, embed: urls.embed, app: urls.app });
        if (res.warn) setWarn(res.warn);
      }
      setRows((prev) => [...next, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'meadow drop failed');
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    const text = rows.map((r) => `${r.name}\n${r.embed}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meadow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch drop to the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. local files go straight into the share db and you get discord-ready /s links back.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing the pile…' : 'drop a handful here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if one is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              <button onClick={copyAll} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy all embed links</button>
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 break-all mt-1">{r.embed}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
