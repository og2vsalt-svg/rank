import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; embed: string; warn?: string };

export default function MasonPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr('');
    const next: Row[] = [];
    try {
      for (const file of [...list]) {
        const dataUrl = await readFile(file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: user?.username || undefined,
        });
        if (!res.ok) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        next.push({
          name: file.name,
          embed: shareUrls(id).embed,
          warn: file.size > 40 * 1024 * 1024 ? 'this one was huge, preview clients may lag' : res.warn,
        });
      }
      setRows(next);
    } catch (e: any) {
      setErr(e?.message || 'mason failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mason</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">lay bricks, get /s links.</h1>
          <p className="text-neutral-400 text-sm mb-6">stack local files into separate public drops. not a zip, not a vault grid. each brick gets its own discord embed.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'laying bricks…' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. huge stacks just take a minute.</p>
          </label>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.embed} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-sm text-white">{r.name}</p>
                <p className="text-xs text-neutral-500 break-all">{r.embed}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
