import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; size: number; embed: string; app: string; warn?: string; error?: string };

export default function PontoonPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setRows([]);
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'heavy pontoon. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        const urls = shareUrls(id);
        next.push({
          name: file.name,
          size: file.size,
          embed: res.ok ? urls.embed : '',
          app: res.ok ? urls.app : '',
          warn: res.warn,
          error: res.ok ? undefined : res.error || 'did not float',
        });
      } catch (e: any) {
        next.push({ name: file.name, size: file.size, embed: '', app: '', error: e?.message || 'did not float' });
      }
      setRows([...next]);
    }
    setBusy(false);
    const first = next.find((r) => r.embed);
    if (first) {
      try { await navigator.clipboard.writeText(first.embed); } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">pontoon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">float a pile across, one drop each.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            every local file becomes its own public share. discord unfurls each /s card separately.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'laying the pontoon…' : 'drop a pile on the pontoon'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <div key={r.name + r.size} className="rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3">
                  <p className="text-sm text-neutral-200">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)}</p>
                  {r.error && <p className="text-xs text-red-400 mt-1">{r.error}</p>}
                  {r.embed && <p className="text-xs text-neutral-400 mt-1 break-all">{r.embed}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
