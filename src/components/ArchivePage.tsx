import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, publishShare, shareUrls } from '../lib/cloudShare';

export default function ArchivePage() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<{ id: string; name: string; size: number }[]>([]);
  const [manifest, setManifest] = useState('');

  const lookup = async () => {
    const ids = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;
    setBusy(true);
    setErr('');
    const found: { id: string; name: string; size: number }[] = [];
    for (const id of ids) {
      const meta = await fetchShare(id);
      if (meta) found.push({ id: meta.id, name: meta.name, size: meta.size });
    }
    if (!found.length) setErr('none of those ids are live in the db');
    setRows(found);
    setBusy(false);
  };

  const publishManifest = async () => {
    if (!rows.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = JSON.stringify(
        {
          kind: 'rankvault-archive',
          createdAt: new Date().toISOString(),
          items: rows,
        },
        null,
        2,
      );
      const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: 'archive.json',
        type: 'application/json',
        size: body.length,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'manifest missed the db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setManifest(shareUrls(res.id || id).embed);
    } finally {
      setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">archive</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stitch live share ids into one card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste ids from existing drops. we look them up in the share db and publish a tiny json manifest with a discord embed.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={5}
            placeholder="one id per line"
            className="w-full rounded-2xl bg-white/5 border border-white/10 text-sm p-4 outline-none mb-4"
          />
          <div className="flex gap-2">
            <button onClick={lookup} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'looking…' : 'lookup'}
            </button>
            {rows.length > 0 && (
              <button onClick={publishManifest} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">
                publish manifest
              </button>
            )}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <ul className="mt-5 space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="text-sm text-neutral-300">
                  {r.name} <span className="text-neutral-600">· {r.id}</span>
                </li>
              ))}
            </ul>
          )}
          {manifest && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">discord embed</p>
              <p className="text-xs text-neutral-300 break-all mt-1">{manifest}</p>
              <button
                onClick={() => navigator.clipboard.writeText(manifest)}
                className="mt-3 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
              >
                copy embed
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
