import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type Staged = {
  key: string;
  file: File;
  status: 'ready' | 'sending' | 'live' | 'fail';
  id?: string;
  embed?: string;
  app?: string;
  error?: string;
};

export default function LoftPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [items, setItems] = useState<Staged[]>([]);
  const [hover, setHover] = useState(false);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const stage = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      status: 'ready' as const,
    }));
    const total = incoming.reduce((n, i) => n + i.file.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'chunky batch. encoding can freeze the tab for a second. no hard cap, just a slowness heads up.' : '');
    setItems((prev) => [...incoming, ...prev]);
  };

  const dropOne = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const publish = async () => {
    const pending = items.filter((i) => i.status === 'ready' || i.status === 'fail');
    if (!pending.length) return;
    setBusy(true);
    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: 'sending', error: undefined } : i)));
      try {
        const dt = new DataTransfer();
        dt.items.add(item.file);
        const result = await addFiles(dt.files, 'loft');
        if (!result.ok || !result.ids?.[0]) {
          setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: 'fail', error: result.error || 'could not park file' } : i)));
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        const urls = shareUrls(id);
        setItems((prev) => prev.map((i) => (i.key === item.key ? {
          ...i,
          status: pub.ok ? 'live' : 'fail',
          id,
          embed: urls.embed,
          app: urls.app,
          error: pub.ok ? undefined : (pub.error || 'saved, cloud publish missed'),
        } : i)));
      } catch (e: any) {
        setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: 'fail', error: e?.message || 'loft drop failed' } : i)));
      }
    }
    setBusy(false);
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied('');
    }
  };

  const live = items.filter((i) => i.status === 'live');

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
          <p className="text-[#0a84ff] text-sm mb-2">loft</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stage a pile, then send it up.</h1>
          <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
            not the vault. loft is a tray. drop a few local files, peek sizes, then publish each one into the share db.
            discord gets the embed url so the card looks like a real drop.
          </p>
          <label
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={(e) => { e.preventDefault(); setHover(false); stage(e.dataTransfer.files); }}
            className={`block cursor-pointer rounded-[24px] border border-dashed p-12 text-center transition-all duration-300 ${
              hover ? 'border-[#0a84ff]/70 bg-[#0a84ff]/5 scale-[1.01]' : 'border-white/15 hover:border-[#0a84ff]/40'
            }`}
          >
            <input type="file" multiple className="hidden" onChange={(e) => stage(e.target.files)} />
            <p className="text-white font-medium">drop a pile or click to pick</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. big batches just get a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <AnimatePresence initial={false}>
            {items.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-2"
              >
                {items.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{item.file.name}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {formatBytes(item.file.size)} · {item.status}
                        </p>
                        {item.error && <p className="text-[11px] text-red-400 mt-1">{item.error}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'live' && item.id && (
                          <button onClick={() => navigate('share', item.id)} className="text-[11px] px-2.5 py-1 rounded-full bg-white text-black">open</button>
                        )}
                        {item.embed && (
                          <button onClick={() => copy(item.embed!, item.key)} className="text-[11px] px-2.5 py-1 rounded-full bg-white/8 text-neutral-200">
                            {copied === item.key ? 'copied' : 'embed'}
                          </button>
                        )}
                        {item.status !== 'sending' && (
                          <button onClick={() => dropOne(item.key)} className="text-[11px] px-2.5 py-1 rounded-full text-neutral-500 hover:text-white">toss</button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              disabled={busy || !items.some((i) => i.status === 'ready' || i.status === 'fail')}
              onClick={publish}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {busy ? 'sending through the loft…' : 'publish staged files'}
            </button>
            {items.length > 0 && (
              <button onClick={() => setItems([])} className="px-5 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition-colors">clear tray</button>
            )}
          </div>
          {live.length > 1 && (
            <p className="text-xs text-neutral-500 mt-4">{live.length} live drops. each link has its own discord card.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
