import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

type Saved = { id: string; note: string; addedAt: number };

const KEY = 'rankvault-nexus';

function load(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(rows: Saved[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export default function NexusPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Saved[]>(() => load());
  const [id, setId] = useState('');
  const [note, setNote] = useState('');
  const [peek, setPeek] = useState<Record<string, CloudMeta | 'miss'>>({});

  useEffect(() => {
    save(rows);
  }, [rows]);

  useEffect(() => {
    rows.forEach(async (r) => {
      if (peek[r.id]) return;
      const meta = await fetchShare(r.id);
      setPeek((p) => ({ ...p, [r.id]: meta || 'miss' }));
    });
  }, [rows]);

  const add = () => {
    const clean = id.trim().replace(/^.*[?&]f=/, '').replace(/^.*\/s\//, '').replace(/[#/?].*$/, '');
    if (!clean) return;
    if (rows.some((r) => r.id === clean)) return;
    setRows([{ id: clean, note: note.trim(), addedAt: Date.now() }, ...rows]);
    setId('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nexus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">incoming drop inbox</h1>
          <p className="text-sm text-neutral-500 mb-6">pin share ids or /s/ links you get from people. not a vault. just a quiet list so you do not lose the url.</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or embed url" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional note" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">pin</button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 && <p className="text-sm text-neutral-500">nothing pinned yet.</p>}
            {rows.map((r) => {
              const meta = peek[r.id];
              return (
                <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{meta && meta !== 'miss' ? meta.name : r.id}</p>
                    <p className="text-xs text-neutral-500 truncate">{r.note || (meta === 'miss' ? 'not live yet' : meta ? `${Math.round(meta.size / 1024)} kb` : 'checking…')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white/8 text-xs">open</button>
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrls(r.id).embed)}
                      className="px-3 py-1.5 rounded-full bg-white/8 text-xs"
                    >
                      embed
                    </button>
                    <button onClick={() => setRows(rows.filter((x) => x.id !== r.id))} className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-neutral-500">drop</button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
