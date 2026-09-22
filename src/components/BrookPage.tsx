import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

type Row = {
  key: string;
  file: File;
  id?: string;
  embed?: string;
  status: string;
};

export default function BrookPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [hover, setHover] = useState(false);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const merge = (list: FileList | null) => {
    if (!list || !list.length) return;
    const next: Row[] = Array.from(list).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      status: 'queued',
    }));
    const total = [...rows, ...next].reduce((n, r) => n + r.file.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'this lineup is chunky. no cap, just a slowness heads up while it hits the share db.' : '');
    setRows((prev) => [...prev, ...next]);
  };

  const clear = () => {
    setRows([]);
    setWarn('');
    setCopied(false);
  };

  const dropOne = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const publish = async () => {
    if (!rows.length) return;
    setBusy(true);
    const updated: Row[] = [];
    for (const row of rows) {
      if (row.id) {
        updated.push(row);
        continue;
      }
      try {
        const dt = new DataTransfer();
        dt.items.add(row.file);
        const result = await addFiles(dt.files, 'brook');
        if (!result.ok || !result.ids?.[0]) {
          updated.push({ ...row, status: result.error || 'could not park file' });
          continue;
        }
        const nextId = result.ids[0];
        const pub = await togglePublic(nextId);
        const urls = shareUrls(nextId);
        updated.push({
          ...row,
          id: nextId,
          embed: urls.embed,
          status: pub.ok ? 'live drop' : pub.error || 'saved, cloud publish missed',
        });
      } catch (e: any) {
        updated.push({ ...row, status: e?.message || 'brook drop failed' });
      }
      setRows([...updated, ...rows.slice(updated.length)]);
    }
    setRows(updated);
    setBusy(false);
  };

  const copyAll = async () => {
    const links = rows.map((r) => r.embed).filter(Boolean) as string[];
    if (!links.length) return;
    try {
      await navigator.clipboard.writeText(links.join('\n'));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const liveCount = rows.filter((r) => r.id).length;
  const bytes = rows.reduce((n, r) => n + r.file.size, 0);

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
          <p className="text-[#0a84ff] text-sm mb-2">brook</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">line up files, then send the stream.</h1>
          <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
            not the vault and not reed. brook is a quiet queue. drop a handful of local files, keep them here, then publish each one to the share db with a discord card.
          </p>
          <label
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => { e.preventDefault(); setHover(false); merge(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-[24px] border border-dashed p-12 text-center transition-all duration-300 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/5 scale-[1.01]' : 'border-white/15 hover:border-[#0a84ff]/40'
            }`}
          >
            <input type="file" multiple className="hidden" onChange={(e) => merge(e.target.files)} />
            <p className="text-white font-medium">drop a few files or click</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. huge lineups just get a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                <span>{rows.length} in the brook · {formatBytes(bytes)}</span>
                <span>{liveCount} live</span>
              </div>
              {rows.map((row) => (
                <div key={row.key} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{row.file.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{formatBytes(row.file.size)} · {row.file.type || 'file'} · {row.status}</p>
                  </div>
                  {row.id && (
                    <button onClick={() => navigate('share', row.id)} className="text-[11px] text-[#0a84ff] shrink-0 pt-0.5">open</button>
                  )}
                  <button onClick={() => dropOne(row.key)} className="text-[11px] text-neutral-500 hover:text-white shrink-0 pt-0.5">out</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              disabled={busy || !rows.length}
              onClick={publish}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {busy ? 'sending stream…' : 'publish lineup'}
            </button>
            {liveCount > 0 && (
              <button onClick={copyAll} className="px-5 py-2.5 rounded-full bg-white/8 text-sm hover:bg-white/12 transition-colors">{copied ? 'embeds copied' : 'copy discord embeds'}</button>
            )}
            {rows.length > 0 && (
              <button onClick={clear} className="px-5 py-2.5 rounded-full bg-white/8 text-sm hover:bg-white/12 transition-colors">clear brook</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
