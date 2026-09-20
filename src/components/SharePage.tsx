import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { useVault } from './VaultContext';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SharePage() {
  const { shareId, navigate } = useRouter();
  const { getPublicFile, bumpDownload } = useVault();
  const local = shareId ? getPublicFile(shareId) : undefined;
  const [cloud, setCloud] = useState<CloudMeta | null>(null);
  const [loading, setLoading] = useState(!!shareId);
  const [err, setErr] = useState('');
  const [pass, setPass] = useState('');
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!shareId) {
        setLoading(false);
        setErr('missing share id');
        return;
      }
      setLoading(true);
      setErr('');
      try {
        const meta = await fetchShare(shareId);
        if (cancelled) return;
        setCloud(meta);
        if (!meta && !getPublicFile(shareId)) {
          setErr('this share is missing, expired, or never made it to the cloud.');
        }
      } catch {
        if (!cancelled) setErr('could not reach the share database.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shareId]);

  const file = cloud
    ? {
        id: cloud.id,
        name: cloud.name,
        type: cloud.type,
        size: cloud.size,
        url: cloud.url,
        lockPass: cloud.lockPass || '',
        expiresAt: cloud.expiresAt || null,
        downloads: cloud.downloads || 0,
        isLocal: false as const,
      }
    : local
      ? {
          id: local.id,
          name: local.name,
          type: local.type,
          size: local.size,
          url: local.dataUrl,
          lockPass: local.lockPass,
          expiresAt: local.expiresAt,
          downloads: local.downloads,
          isLocal: true as const,
        }
      : null;

  const locked = !!(file && file.lockPass && !ok);

  const copyEmbed = async () => {
    if (!file) return;
    const url = shareUrls(file.id).embed;
    await navigator.clipboard.writeText(url);
    setCopied(url);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          {loading ? (
            <p className="text-neutral-400 text-sm">loading share…</p>
          ) : !file ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">share</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">nothing here</h1>
              <p className="text-sm text-neutral-500 mb-6">{err || 'this link does not point to a live public drop.'}</p>
              <button onClick={() => navigate('home')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">back home</button>
            </>
          ) : locked ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">locked drop</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{file.name}</h1>
              <p className="text-sm text-neutral-500 mb-5">this share has a passcode. type it to peek.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pass === file.lockPass) setOk(true);
                }}
                className="flex gap-2"
              >
                <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="passcode" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
                <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">unlock</button>
              </form>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">{file.isLocal ? 'local public drop' : 'cloud public drop'}</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">{file.name}</h1>
              <p className="text-sm text-neutral-500 mb-6">{formatBytes(file.size)} · {file.type || 'file'}{file.expiresAt ? ' · expires ' + new Date(file.expiresAt).toLocaleString() : ''}</p>
              {file.type.startsWith('image/') && <img src={file.url} alt="" className="w-full rounded-2xl mb-6" />}
              {file.type.startsWith('video/') && <video src={file.url} controls className="w-full rounded-2xl mb-6" />}
              {file.type.startsWith('audio/') && <audio src={file.url} controls className="w-full mb-6" />}
              {file.type.startsWith('text/') && !file.type.includes('html') && file.url.startsWith('data:') && (
                <pre className="text-xs text-neutral-400 bg-black/30 rounded-2xl p-4 mb-6 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                  {(() => { try { return atob(file.url.split(',')[1] || ''); } catch { return ''; } })()}
                </pre>
              )}
              <div className="flex flex-wrap gap-2">
                <a
                  href={file.url}
                  download={file.name}
                  onClick={() => { if (file.isLocal) bumpDownload(file.id); }}
                  className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
                >
                  download
                </a>
                <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex px-5 py-2.5 rounded-full bg-white/5 text-sm">open raw</a>
                <button onClick={copyEmbed} className="inline-flex px-5 py-2.5 rounded-full bg-white/5 text-sm">copy discord link</button>
              </div>
              {copied && <p className="text-xs text-neutral-500 mt-4">embed url: {copied}</p>}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
