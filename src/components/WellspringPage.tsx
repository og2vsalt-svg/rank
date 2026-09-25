import { useState } from 'react';
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

export default function WellspringPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [id, setId] = useState('');
  const [app, setApp] = useState('');
  const [embed, setEmbed] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    setName(file.name);
    setSize(file.size);
    setWarn(file.size > 40 * 1024 * 1024 ? 'huge file. tab might nap while it encodes. still no hard cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not stash it. you logged in?');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const nextId = result.ids?.[0];
      if (!nextId) {
        setErr('saved but no id landed');
        return;
      }
      const pub = await togglePublic(nextId);
      if (!pub.ok) {
        setErr(pub.error || 'vault saved, cloud publish missed');
        setId(nextId);
        return;
      }
      setId(nextId);
      const urls = shareUrls(nextId);
      setApp(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'wellspring missed');
    } finally {
      setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">wellspring</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one file. a receipt. a discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not another vault grid. drop a local file, we park it in the share db and hand you a /s link that previews clean on discord.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only whisper if it might lag.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-[22px] bg-white/[0.04] border border-white/8 p-5 space-y-3"
            >
              <p className="text-sm text-white truncate">{name || 'untitled'}</p>
              <p className="text-xs text-neutral-500">{pretty(size)} · id {id}</p>
              {embed && <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
              {app && <p className="text-xs text-neutral-500 break-all">app: {app}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
