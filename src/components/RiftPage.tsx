import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function RiftPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [appLink, setAppLink] = useState('');
  const [embedLink, setEmbedLink] = useState('');
  const [copied, setCopied] = useState('');

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    const chunky = file.size > 40 * 1024 * 1024;
    setWarn(chunky ? 'huge file. encoding might stall the tab for a bit. no hard cap, just a heads up.' : '');
    setErr('');
    setBusy(true);
    setName(file.name);
    setSize(file.size);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not park the file. try logging in.');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved locally but no share id came back');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'local save worked, cloud publish missed');
        setLastId(id);
        return;
      }
      const urls = shareUrls(id);
      setLastId(id);
      setAppLink(urls.app);
      setEmbedLink(urls.embed);
    } catch (e: any) {
      setErr(e?.message || 'rift drop failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied('');
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
          <p className="text-[#0a84ff] text-sm mb-2">rift</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park a local file in the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
            picks a file off your machine, stores it in the vault, then publishes a public share row.
            discord crawlers hit the embed url so the card looks clean.
          </p>
          <label
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => { e.preventDefault(); setHover(false); run(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-[24px] border border-dashed p-12 text-center transition-all duration-300 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/5 scale-[1.01]' : 'border-white/15 hover:border-[#0a84ff]/40'
            }`}
          >
            <input type="file" className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sending through the rift…' : 'drop a file or click to pick one'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. big ones just get a slowness warning.</p>
          </label>
          {name && (
            <p className="text-xs text-neutral-400 mt-4">
              {name} · {formatBytes(size)}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              {appLink && <p className="text-xs text-neutral-500 break-all">app link: {appLink}</p>}
              {embedLink && <p className="text-xs text-neutral-500 break-all">discord embed: {embedLink}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors">open share</button>
                {embedLink && (
                  <button onClick={() => copy(embedLink, 'embed')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition-colors">
                    {copied === 'embed' ? 'copied embed' : 'copy discord link'}
                  </button>
                )}
                {appLink && (
                  <button onClick={() => copy(appLink, 'app')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition-colors">
                    {copied === 'app' ? 'copied app' : 'copy app link'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
