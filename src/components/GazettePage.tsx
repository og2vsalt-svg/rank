import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function GazettePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listPublicShares(36);
      if (alive) {
        setRows(list);
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
          <p className="text-[#0a84ff] text-sm mb-2">gazette</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">what just crossed the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">public drops only. copy the /s card for discord, or open the file in the app.</p>
          {busy && <p className="text-sm text-neutral-500">listening…</p>}
          {!busy && rows.length === 0 && <p className="text-sm text-neutral-500">quiet right now.</p>}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate('share', row.id)} className="flex-1 text-left min-w-0">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-[11px] text-neutral-500">
                    {pretty(row.size)} · {row.type.split(';')[0]}
                    {row.author ? ' · ' + row.author : ''}
                  </p>
                </button>
                <button
                  onClick={async () => {
                    const url = shareUrls(row.id).embed;
                    await navigator.clipboard.writeText(url);
                    setCopied(row.id);
                  }}
                  className="text-[12px] text-neutral-400 hover:text-white shrink-0"
                >
                  {copied === row.id ? 'copied' : 'discord'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
