import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Row = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  caption?: string;
  author?: string;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function MizzenPage() {
  const { shareId, navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [focus, setFocus] = useState<Row | null>(null);
  const [status, setStatus] = useState('reading the shelf…');

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const list = await fetch('/api/chock?list=1&page=mizzen');
        const data = await list.json();
        if (!stop) setRows(Array.isArray(data.files) ? data.files : []);
        if (shareId) {
          const one = await fetch(`/api/chock?id=${encodeURIComponent(shareId)}&page=mizzen`);
          const row = await one.json();
          if (!stop && one.ok) setFocus(row);
        }
        if (!stop) setStatus('');
      } catch {
        if (!stop) setStatus('the shelf did not answer. try again in a moment.');
      }
    })();
    return () => { stop = true; };
  }, [shareId]);

  const fileUrl = focus ? `/api/chock?id=${encodeURIComponent(focus.id)}&file=1` : '';
  const isImage = /^image\//.test(focus?.mime || '');
  const isText = /text\/|json|javascript/.test(focus?.mime || '');

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="text-[13px] text-white/45">mizzen</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-2 text-[40px] leading-none tracking-tight font-semibold">
          Read what is already stored.
        </motion.h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
          Not another drop box. This is the shelf: captions, previews, and a link you can paste into Discord.
        </p>
        {status && <p className="mt-4 text-sm text-white/45">{status}</p>}
        {focus && (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">{focus.author || 'someone'}</p>
            <h2 className="mt-1 text-xl font-medium">{focus.name}</h2>
            <p className="mt-1 text-sm text-white/50">{pretty(Number(focus.size) || 0)}{focus.caption ? ` · ${focus.caption}` : ''}</p>
            {isImage && <img src={fileUrl} alt="" className="mt-4 max-h-80 w-full rounded-2xl object-contain bg-black/40" />}
            {isText && <iframe title={focus.name} src={fileUrl} className="mt-4 h-64 w-full rounded-2xl bg-black/40" />}
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a href={fileUrl} className="text-[#0A84FF]">open file</a>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/mizzen/${focus.id}`)} className="text-white/70 hover:text-white">copy link</button>
            </div>
          </motion.article>
        )}
        <ul className="mt-8 space-y-2">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease, delay: Math.min(i, 8) * 0.03 }}>
              <button onClick={() => navigate('mizzen', row.id)} className="w-full text-left rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition-colors">
                <span className="block truncate text-[15px]">{row.name}</span>
                <span className="mt-0.5 block text-xs text-white/40">{pretty(Number(row.size) || 0)} · {row.caption || 'no caption'}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
