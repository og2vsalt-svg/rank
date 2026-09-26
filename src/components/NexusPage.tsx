import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function NexusPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const refresh = async () => {
    const list = await listPublicShares(36);
    setRows(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'chunky file. the tab might hitch while it encodes. no hard cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">nexus</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">one desk for public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl">upload a local file, land it in the db, grab the discord embed url. browse recent public shares without living in the vault.</p>

          <label
            className="block cursor-pointer rounded-[28px] glass p-8 mb-8 border border-dashed border-white/12 hover:border-[#0a84ff]/40 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop files here'}</p>
            <p className="text-xs text-neutral-500 mt-2">publishes to supabase. huge files just warn about slowness.</p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mb-6 break-all">discord embed copied: {link}</p>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate('share', r.id)}
                className="text-left rounded-[22px] bg-white/[0.04] border border-white/8 p-4 hover:bg-white/[0.07] transition"
              >
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{pretty(r.size)} · {(r.type || 'file').split(';')[0]}</p>
                <p className="text-[11px] text-neutral-600 mt-2 truncate">/s/{r.id}</p>
              </button>
            ))}
          </div>
          {!rows.length && <p className="text-sm text-neutral-500">no public drops yet, or the db is quiet.</p>}
        </motion.div>
      </div>
    </div>
  );
}
