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

export default function WherryPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = [...list];
    setErr('');
    setRows([]);
    setWarn(files.some((f) => f.size > 20 * 1024 * 1024) ? 'one or more cargo is heavy. ferry still runs, the tab may lag. no cap.' : '');
    setBusy(true);
    const next: { name: string; embed: string }[] = [];
    try {
      for (const f of files) {
        const dataUrl = await readAsDataUrl(f);
        const id = uid();
        const pub = await publishShare({
          id,
          name: f.name,
          type: f.type || 'application/octet-stream',
          size: f.size,
          dataUrl,
          author: 'wherry',
        });
        if (!pub.ok) {
          setErr(pub.error || `could not ferry ${f.name}`);
          continue;
        }
        next.push({ name: f.name, embed: shareUrls(id).embed });
      }
      setRows(next);
      if (next[0]) {
        try {
          await navigator.clipboard.writeText(next.map((r) => r.embed).join('\n'));
        } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'wherry failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">wherry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">ferry several locals across.</h1>
          <p className="text-neutral-400 text-sm mb-6">each file becomes its own public row. embed links are copied as a list so discord can unfurl every card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center hover:bg-white/[0.05]">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'on the water…' : 'load the wherry'}</span>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if cargo is huge.</p>
          </label>
          {warn && <p className="mt-4 text-amber-300/90 text-sm">{warn}</p>}
          {err && <p className="mt-4 text-rose-300 text-sm break-all">{err}</p>}
          {rows.length > 0 && (
            <ul className="mt-5 space-y-2 text-xs text-neutral-400 break-all">
              {rows.map((r) => (
                <li key={r.embed}>{r.name} — {r.embed}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
