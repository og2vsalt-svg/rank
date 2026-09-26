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

export default function WeirPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string; app: string }[]>([]);

  const send = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setErr('');
    setRows([]);
    const files = Array.from(list);
    const heavy = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'one of these is chunky. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    const out: { name: string; embed: string; app: string }[] = [];
    try {
      let i = 0;
      for (const file of files) {
        i += 1;
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const name = `${String(i).padStart(2, '0')}-${file.name}`;
        const res = await publishShare({
          id,
          name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          setErr(res.error || 'weir jammed');
          break;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(id);
        out.push({ name, embed: urls.embed, app: urls.app });
      }
      setRows(out);
      if (out[0]) {
        try { await navigator.clipboard.writeText(out[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'weir stayed dry');
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
          <p className="text-[#0a84ff] text-sm mb-2">weir</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">let a pile spill through in order.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            each file gets a numbered name and its own public drop. discord still uses /s.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'spilling…' : 'drop a pile on the weir'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              {rows.map((r) => (
                <div key={r.embed} className="text-xs text-neutral-400 break-all">
                  <p className="text-white text-sm mb-1">{r.name}</p>
                  <p>discord: {r.embed}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
