import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

type Alias = { slug: string; id: string; at: number };

const KEY = 'rankvault-laneway';

function load(): Alias[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(rows: Alias[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 80)));
}

export default function LanewayPage() {
  const [slug, setSlug] = useState('');
  const [id, setId] = useState('');
  const [rows, setRows] = useState<Alias[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [peek, setPeek] = useState('');

  useEffect(() => {
    setRows(load());
  }, []);

  const pin = async () => {
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 32);
    const shareId = id.trim();
    if (!s || !shareId) {
      setErr('need a short alias and a share id');
      return;
    }
    setErr('');
    setOk('');
    const live = await fetchShare(shareId);
    if (!live) {
      setErr('that share id is not live in the db');
      return;
    }
    const next = [{ slug: s, id: shareId, at: Date.now() }, ...rows.filter((r) => r.slug !== s)];
    save(next);
    setRows(next);
    setOk(`pinned ${s} → ${shareId}`);
    setPeek(shareUrls(shareId).embed);
  };

  const open = (row: Alias) => {
    const urls = shareUrls(row.id);
    setPeek(urls.embed);
    try { navigator.clipboard.writeText(urls.embed); } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">laneway</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">give a live drop a short name.</h1>
          <p className="text-neutral-400 text-sm mb-7">
            aliases stay in this browser. the actual file still lives in the share db. discord cards still use /s/id.
          </p>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="short name, like summer-mix"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40 mb-3"
          />
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="existing public share id"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40"
          />
          <button
            onClick={pin}
            className="mt-4 w-full rounded-full bg-white text-black py-2.5 text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            pin alias
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {ok && <p className="text-xs text-neutral-400 mt-3">{ok}</p>}
          {peek && <p className="text-xs text-neutral-500 break-all mt-2">discord embed: {peek}</p>}

          <div className="mt-8 space-y-2">
            {rows.length === 0 && <p className="text-sm text-neutral-500">no aliases yet.</p>}
            {rows.map((row) => (
              <button
                key={row.slug}
                onClick={() => open(row)}
                className="w-full text-left rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/5 hover:border-[#0a84ff]/30 transition-colors"
              >
                <p className="text-sm text-white">{row.slug}</p>
                <p className="text-[11px] text-neutral-500 truncate">{row.id}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
