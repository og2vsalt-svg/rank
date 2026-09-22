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

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ReedPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [hover, setHover] = useState(false);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [id, setId] = useState('');
  const [embed, setEmbed] = useState('');
  const [copied, setCopied] = useState(false);

  const pick = async (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    setFile(next);
    setId('');
    setEmbed('');
    setStatus('');
    setWarn(next.size > 50 * 1024 * 1024 ? 'big file. hashing stays in this tab so it can stall for a bit. no cap, just a slowness heads up.' : '');
    setBusy(true);
    try {
      const digest = await sha256(next);
      setHash(digest);
      setStatus('receipt ready');
    } catch {
      setHash('');
      setStatus('could not hash that file');
    }
    setBusy(false);
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setStatus('sending to the share db');
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      const result = await addFiles(dt.files, 'reed');
      if (!result.ok || !result.ids?.[0]) {
        setStatus(result.error || 'could not park file');
        setBusy(false);
        return;
      }
      const nextId = result.ids[0];
      const pub = await togglePublic(nextId);
      const urls = shareUrls(nextId);
      setId(nextId);
      setEmbed(urls.embed);
      setStatus(pub.ok ? 'live drop + receipt' : (pub.error || 'saved, cloud publish missed'));
    } catch (e: any) {
      setStatus(e?.message || 'reed drop failed');
    }
    setBusy(false);
  };

  const copy = async () => {
    if (!embed) return;
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(true);
    } catch {
      setCopied(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">reed</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash first, then share if you want.</h1>
          <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
            not the vault and not loft. reed writes a local sha-256 receipt before anything leaves the tab.
            publish only if you want a public drop with a discord card.
          </p>
          <label
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => { e.preventDefault(); setHover(false); pick(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-[24px] border border-dashed p-12 text-center transition-all duration-300 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/5 scale-[1.01]' : 'border-white/15 hover:border-[#0a84ff]/40'
            }`}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one file or click'}</p>
            <p className="text-xs text-neutral-500 mt-2">{file ? formatBytes(file.size) : 'no file cap. huge files just get a slowness warning.'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {hash && (
            <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="text-[11px] text-neutral-500 mb-1">sha-256</p>
              <p className="text-xs text-neutral-200 break-all font-mono leading-relaxed">{hash}</p>
            </div>
          )}
          {status && <p className="text-xs text-neutral-400 mt-4">{status}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              disabled={busy || !file}
              onClick={publish}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {busy ? 'working…' : 'publish receipt drop'}
            </button>
            {id && (
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white/8 text-sm hover:bg-white/12 transition-colors">open drop</button>
            )}
            {embed && (
              <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white/8 text-sm hover:bg-white/12 transition-colors">{copied ? 'embed copied' : 'copy discord embed'}</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
