import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ScrollPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const publish = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setErr('');
    setLink('');
    const text = `# ${title || 'untitled scroll'}\n\n${body}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], `${(title || 'scroll').replace(/[^a-z0-9]/gi, '_')}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: title || 'scroll', cardTitle: title || 'scroll' });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'could not publish');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(res.id!);
    setLink(urls.app);
    try { await navigator.clipboard.writeText(urls.app); } catch {}
  };

  const onFile = async (list: FileList | null) => {
    if (!list?.[0] || busy) return;
    const file = list[0];
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file — upload may feel slow. nothing is refused.' : '');
    setBusy(true);
    setErr('');
    setLink('');
    const res = await publishLocalFile(file, { caption: title || 'from scroll', cardTitle: file.name });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'file did not land');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(res.id!);
    setLink(urls.app);
    try { await navigator.clipboard.writeText(urls.app); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          className="glass rounded-[40px] p-8 md:p-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">scroll</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">unroll a longer note</h1>
          <p className="text-neutral-400 text-sm mb-7">write at length or attach a file. the share link carries a polished Discord embed. large drops only receive a gentle warning.</p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition mb-4"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="the longer thought…"
            rows={10}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none mb-5"
          />

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={publish}
              disabled={busy || !body.trim()}
              className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'publishing…' : 'publish scroll'}
            </motion.button>

            <label className="cursor-pointer px-6 py-3 rounded-full border border-white/15 text-sm hover:bg-white/5 transition">
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
              attach file
            </label>
          </div>

          {warn && <p className="text-xs text-amber-300/90 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-white/5">
              <p className="text-xs text-neutral-400 break-all mb-2">link copied: {link}</p>
              <button onClick={() => navigate('share', link.split('/').pop())} className="text-xs text-[#0A84FF]">open share</button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
