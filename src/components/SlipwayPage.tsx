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

type Row = { name: string; embed: string; warn?: string; error?: string };

export default function SlipwayPage() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState('');

  const send = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setBusy(true);
    setRows([]);
    const out: Row[] = [];
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
          author: note.trim() || undefined,
        });
        const urls = shareUrls(id);
        out.push({
          name: file.name,
          embed: res.ok ? urls.embed : '',
          warn: res.warn || (file.size > 40 * 1024 * 1024 ? 'sleepy encode possible. no cap.' : undefined),
          error: res.ok ? undefined : res.error || 'missed the slip',
        });
      } catch (e: any) {
        out.push({ name: file.name, embed: '', error: e?.message || 'missed the slip' });
      }
      setRows([...out]);
    }
    const first = out.find((r) => r.embed);
    if (first) {
      try { await navigator.clipboard.writeText(first.embed); } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">slipway</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">slide a pile of files into the water.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            each file becomes its own public drop. each one gets a discord /s card. not a vault grid.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional author note"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/40"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sliding…' : 'drop a pile on the slipway'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. big piles just take longer.</p>
          </label>
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <div key={r.name + r.embed} className="rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3">
                  <p className="text-sm text-white">{r.name}</p>
                  {r.embed && <p className="text-xs text-neutral-400 break-all mt-1">{r.embed}</p>}
                  {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                  {r.error && <p className="text-xs text-red-400 mt-1">{r.error}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
