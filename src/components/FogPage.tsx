import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function nid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

type Row = { id: string; name: string; size: number; embed: string; warn?: string; error?: string };

export default function FogPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [hours, setHours] = useState('0');
  const [rows, setRows] = useState<Row[]>([]);
  const [hint, setHint] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const total = files.reduce((s, f) => s + f.size, 0);
    setHint(total > 40 * 1024 * 1024 ? 'chunky batch. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
    const expiresAt =
      Number(hours) > 0 ? new Date(Date.now() + Number(hours) * 3600 * 1000).toISOString() : null;
    for (const file of files) {
      const idv = nid();
      try {
        const dataUrl = await readFile(file);
        const res = await publishShare({
          id: idv,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          expiresAt,
        });
        next.push({
          id: res.id || idv,
          name: file.name,
          size: file.size,
          embed: shareUrls(res.id || idv).embed,
          warn: res.warn,
          error: res.ok ? undefined : res.error,
        });
      } catch (e: any) {
        next.push({ id: idv, name: file.name, size: file.size, embed: '', error: e?.message || 'fail' });
      }
      setRows([...next]);
    }
    setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">fog</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch drop into the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a pile of local files. each one becomes its own public_shares row plus a discord-ready /s/ link.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">expire after hours</label>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="numeric"
              className="w-20 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <span className="text-xs text-neutral-600">0 = keep</span>
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'pick local files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if the stack is huge.</p>
          </label>
          {hint && <p className="text-xs text-amber-300/80 mt-4">{hint}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(r.size)}</p>
                  {r.error && <p className="text-xs text-red-400 mt-2">{r.error}</p>}
                  {r.warn && <p className="text-xs text-amber-300/80 mt-2">{r.warn}</p>}
                  {r.embed && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => navigator.clipboard.writeText(r.embed)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy embed</button>
                      <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs">open</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
