import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function SolacePage() {
  const { addFiles, togglePublic } = useVault();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    setLink('');
    if (body.length > 400000) setWarn('this note is huge. encoding might feel sleepy. no hard cap.');
    else setWarn('');
    try {
      const file = new File([body], `solace-${Date.now()}.txt`, { type: 'text/plain' });
      const result = await addFiles([file] as unknown as FileList, 'inbox');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not park the note');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud publish missed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed || urls.app);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'solace failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">solace</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park a note, get a quiet link.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault grid. just paste something, publish it as a public txt, copy the discord /s card.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="drop thoughts here…" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 resize-y min-h-[180px]" />
          <button onClick={publish} disabled={busy || !text.trim()} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition">
            {busy ? 'publishing…' : 'publish note'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
