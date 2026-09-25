import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function CisternPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [id, setId] = useState<string | null>(null);

  const meta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      last: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—',
    };
  }, [file]);

  const take = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setErr('');
    setLink('');
    setId(null);
    setWarn(f.size > 40 * 1024 * 1024 ? 'huge file. hashing + publish can feel slow. still no hard cap.' : '');
    try {
      const buf = await f.arrayBuffer();
      setDigest(await sha256(buf));
    } catch {
      setDigest('could not hash in this browser');
    }
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const result = await addFiles([file] as unknown as FileList, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'need a session to park this in the vault');
        return;
      }
      const next = result.ids?.[0];
      if (!next) {
        setErr('saved but no id');
        return;
      }
      const pub = await togglePublic(next);
      if (!pub.ok) {
        setErr(pub.error || 'vault ok, cloud publish failed');
        setId(next);
        return;
      }
      setId(next);
      const urls = shareUrls(next);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">cistern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">inspect a local file, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not another vault grid. peek size, type, and sha-256, then push to the public share table. discord cards use /s/id.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file size lock. just a lag warning if it is massive.</p>
          </label>
          {meta && (
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3"><p className="text-neutral-500 text-xs">type</p><p className="text-white break-all">{meta.type}</p></div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3"><p className="text-neutral-500 text-xs">size</p><p className="text-white">{pretty(meta.size)}</p></div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3 col-span-2"><p className="text-neutral-500 text-xs">modified</p><p className="text-white">{meta.last}</p></div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3 col-span-2"><p className="text-neutral-500 text-xs">sha-256</p><p className="text-white text-xs break-all font-mono">{digest || 'hashing…'}</p></div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {meta && (
            <button onClick={publish} disabled={busy} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 transition-transform active:scale-[0.98]">
              {busy ? 'publishing…' : 'publish share link'}
            </button>
          )}
          {id && !err && (
            <div className="mt-5 space-y-2">
              {link && <p className="text-xs text-neutral-400 break-all">embed link (copied): {link}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/10 text-sm">open share</button>
                <button onClick={() => navigate('vault')} className="px-4 py-2 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
