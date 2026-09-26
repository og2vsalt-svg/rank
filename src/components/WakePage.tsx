import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

const WORDS = ['quiet', 'ember', 'harbor', 'lumen', 'drift', 'cedar', 'slate', 'tide', 'opal', 'mist', 'keel', 'grove'];

function phrase() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}`;
}

export default function WakePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [tag, setTag] = useState(phrase());
  const [name, setName] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const stamped = tag.trim() ? `${tag.trim()} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name: stamped,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: tag.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'wake missed the water');
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
          <p className="text-[#0a84ff] text-sm mb-2">wake</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tag a drop. keep the trail soft.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            stamp a short wake phrase onto one local file, then park it in the share db. discord still unfurls /s.
          </p>
          <div className="flex gap-2 mb-5">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value.slice(0, 64))}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50"
              placeholder="wake phrase"
            />
            <button
              type="button"
              onClick={() => setTag(phrase())}
              className="px-4 py-2.5 rounded-2xl bg-white/8 text-sm text-neutral-200 hover:bg-white/12 transition"
            >
              shuffle
            </button>
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'leaving a wake…' : 'drop one file into the wake'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {name && <p className="text-xs text-neutral-500 mt-4">{name}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
