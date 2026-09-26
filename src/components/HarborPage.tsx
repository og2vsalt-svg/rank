import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const KEY = 'rankvault-harbor';

function load(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function extractId(input: string) {
  const t = input.trim();
  const m = t.match(/[?#](?:share\?f=|f=)?([a-z0-9_-]{6,64})/i) || t.match(/\/(?:s|f|d|u|v|share|drop|file)\/([a-z0-9_-]{6,64})/i);
  if (m) return m[1];
  if (/^[a-z0-9_-]{6,64}$/i.test(t)) return t;
  return null;
}

export default function HarborPage() {
  const { navigate } = useRouter();
  const [ids, setIds] = useState<string[]>(load);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const id = extractId(draft);
    if (!id) {
      setErr('paste a rankvault share link or id');
      return;
    }
    const next = [id, ...ids.filter((x) => x !== id)].slice(0, 80);
    setIds(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setDraft('');
    setErr('');
  };

  const remove = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const hint = useMemo(() => (ids.length > 40 ? 'long dock. scrolling is fine, opening everything at once might feel slow.' : ''), [ids]);

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
          <p className="text-[#0a84ff] text-sm mb-2">harbor</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park incoming shares.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste links people send you. they sit here until you open them. local only, no extra vault dump.</p>
          <div className="flex gap-2 mb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="https://…/s/id or a raw id"
              className="flex-1 rounded-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">dock</button>
          </div>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          {hint && <p className="text-xs text-amber-300/80 mb-3">{hint}</p>}
          {ids.length === 0 && <p className="text-sm text-neutral-500">harbor is empty.</p>}
          <ul className="space-y-2">
            {ids.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <button onClick={() => navigate('share', id)} className="text-sm text-white truncate text-left">{id}</button>
                <button onClick={() => remove(id)} className="text-[11px] text-neutral-500 hover:text-red-400">undock</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
