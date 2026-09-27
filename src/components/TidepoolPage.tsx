import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishShare, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function TidepoolPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [author, setAuthor] = useState('');

  const refresh = () => listPublicShares(20).then(setRows);

  useEffect(() => {
    refresh();
  }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: author.trim() || undefined,
      });
      if (!res.ok) {
        setMsg(res.error || 'drop failed');
        return;
      }
      setMsg(res.warn || 'in the pool.');
      await refresh();
      navigate('share', id);
    } catch (e: any) {
      setMsg(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">tidepool</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a local file into the public pool.</h1>
          <p className="text-neutral-400 text-sm mb-6">no hard cap. huge files just warn you that the tab might lag.</p>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="optional name on the drop"
            className="w-full mb-4 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <label className="block rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 bg-white/[0.02] px-6 py-10 text-center cursor-pointer transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-white">{busy ? 'sending…' : 'choose a file'}</p>
            <p className="text-[12px] text-neutral-500 mt-1">lands in supabase. discord embeds ride /s/id</p>
          </label>
          {msg && <p className="text-sm text-neutral-400 mt-4">{msg}</p>}
          <div className="mt-8 space-y-2">
            {rows.map((r, i) => {
              const urls = shareUrls(r.id);
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.35) }}
                  onClick={() => navigate('share', r.id)}
                  className="w-full text-left rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-4 py-3"
                >
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{pretty(r.size)} · {urls.embed}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
