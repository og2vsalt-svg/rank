import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

type Row = { name: string; size: number; id?: string; link?: string; err?: string; warn?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function KettlePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState('');

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setNote(chunky ? 'some of these are chunky. the tab may hitch while encoding. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const row: Row = { name: file.name, size: file.size };
      try {
        const result = await addFiles([file], 'drops');
        if (!result.ok || !result.ids?.[0]) {
          row.err = result.error || 'could not save';
        } else {
          if (result.warn) row.warn = result.warn;
          const id = result.ids[0];
          const pub = await togglePublic(id);
          if (!pub.ok) {
            row.err = pub.error || 'saved locally, cloud publish missed';
            row.id = id;
          } else {
            row.id = id;
            row.link = shareUrls(id).app;
          }
        }
      } catch (e: any) {
        row.err = e?.message || 'failed';
      }
      next.push(row);
      setRows([...next]);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">kettle</p>
          <h1 className="text-3xl font-semibold mb-3">simmer a batch, publish each.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop several local files. each one lands in the vault and tries the public db on its own. no size cap — only a slowness note.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop a handful here'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited count. we only warn when the browser might wheeze.</p>
          </label>
          {note && <p className="text-xs text-amber-300/80 mt-4">{note}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="rounded-2xl bg-white/[0.04] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.name}</p>
                    <p className="text-[11px] text-neutral-500">{pretty(r.size)}{r.warn ? ' · ' + r.warn : ''}{r.err ? ' · ' + r.err : ''}</p>
                  </div>
                  {r.id && (
                    <button onClick={() => navigate('share', r.id)} className="shrink-0 text-[12px] px-3 py-1.5 rounded-full bg-white text-black">open</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
