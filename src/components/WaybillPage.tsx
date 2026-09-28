import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; size: number; status: string; embed?: string };

export default function WaybillPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const run = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const fat = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(fat ? 'one or more files are chunky. queue still runs. no hard limit.' : '');
    setBusy(true);
    const next: Row[] = files.map((f) => ({ name: f.name, size: f.size, status: 'queued' }));
    setRows(next);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'shipping' } : r)));
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = crypto.randomUUID().slice(0, 10);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        const embed = shareUrls(res.id || id).embed;
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: res.ok ? 'shipped' : res.error || 'failed', embed: res.ok ? embed : undefined } : r)));
      } catch (e: any) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: e?.message || 'failed' } : r)));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] text-[#0a84ff] mb-3">waybill</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">batch ship files to the db</h1>
          <p className="text-neutral-400 mb-8">queue local files, upload each one, get discord-ready /s/ links. vault stays untouched.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white">{busy ? 'shipping…' : 'pick a handful of files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if the batch is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300 mt-3">{warn}</p>}
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(r.size)} · {r.status}</p>
                  {r.embed && <p className="text-xs text-[#0a84ff] break-all mt-1">{r.embed}</p>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
