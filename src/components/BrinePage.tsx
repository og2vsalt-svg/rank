import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';

type Row = { name: string; id?: string; link?: string; err?: string; warn?: string };

export default function BrinePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const big = files.some((f) => f.size > 10 * 1024 * 1024);
    setWarn(big ? 'one or more files are chunky. queue still runs. no hard limit, just slowness.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        const id = crypto.randomUUID().slice(0, 10);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) next.push({ name: file.name, err: res.error || 'failed' });
        else {
          const sid = res.id || id;
          next.push({
            name: file.name,
            id: sid,
            link: `${window.location.origin}/s/${sid}`,
            warn: res.warn,
          });
        }
      } catch (e: any) {
        next.push({ name: file.name, err: e?.message || 'failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">brine</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">queue of drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a handful of local files, upload each to the share db, walk away with a stack of /s links that embed clean on discord.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing batch…' : 'pick several local files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if the batch is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.name + (r.id || '')} className="rounded-2xl bg-black/30 p-4">
                <p className="text-sm text-white">{r.name}</p>
                {r.err && <p className="text-xs text-red-400 mt-1">{r.err}</p>}
                {r.link && (
                  <p className="text-xs break-all text-neutral-400 mt-1">{r.link}</p>
                )}
                {r.link && (
                  <button
                    onClick={() => navigator.clipboard.writeText(r.link!)}
                    className="mt-2 text-xs text-[#0a84ff]"
                  >
                    copy embed
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
