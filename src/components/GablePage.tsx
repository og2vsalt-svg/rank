import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function tidy(name: string) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 'drop.bin';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function GablePage() {
  const [rows, setRows] = useState<{ file: File; clean: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).map((file) => ({ file, clean: tidy(file.name) }));
    setRows(next);
    setLinks([]);
    const heavy = next.some((r) => r.file.size > 40 * 1024 * 1024);
    setNote(heavy ? 'no cap. some of these might make the tab feel sleepy while they encode.' : '');
  };

  const ship = async () => {
    if (!rows.length) return;
    setBusy(true);
    setLinks([]);
    const out: string[] = [];
    try {
      for (const row of rows) {
        const dataUrl = await readAsDataUrl(row.file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await publishShare({
          id,
          name: row.clean,
          type: row.file.type || 'application/octet-stream',
          size: row.file.size,
          dataUrl,
        });
        if (!res.ok) throw new Error(res.error || 'publish missed');
        out.push(shareUrls(res.id || id).embed);
      }
      setLinks(out);
      try { await navigator.clipboard.writeText(out[0]); } catch {}
      setNote('first discord card copied. rest listed below.');
    } catch (e: any) {
      setNote(e?.message || 'gable failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">gable</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">clean names, then ship the pile.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. tidy filenames on device, then each file becomes its own public drop with a discord /s card.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">drop a pile</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {rows.length > 0 && (
            <div className="mt-5 space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.clean}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{r.file.name} · {pretty(r.file.size)}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={ship}
                disabled={busy}
                className="mt-2 text-[13px] font-medium px-4 py-2 rounded-full bg-white text-black disabled:opacity-50"
              >
                {busy ? 'shipping…' : 'publish all'}
              </button>
            </div>
          )}
          {note && <p className="text-xs text-neutral-400 mt-4">{note}</p>}
          {links.length > 0 && (
            <div className="mt-4 space-y-1">
              {links.map((l) => (
                <p key={l} className="text-xs text-neutral-500 break-all">{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
