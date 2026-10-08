import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CavettoPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [saved, setSaved] = useState<any>(null);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this drop is large. the tab may feel slow while it sends. nothing is refused.' : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setSaved);
  }, [shareId]);

  async function hollow() {
    setError('');
    if (!title.trim() || !passage.trim()) {
      setError('a title and a passage. the file is optional.');
      return;
    }
    setBusy(true);
    try {
      const payload = file || new File([`${title.trim()}\n\n${passage.trim()}\n`], 'cavetto.txt', { type: 'text/plain' });
      const published = await publishLocalFile(payload, {
        caption: passage.trim().slice(0, 280),
        cardTitle: title.trim().slice(0, 80),
        color: '#5ac8fa',
        meta: { kind: 'cavetto', passage: passage.trim().slice(0, 4000), title: title.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the hollow did not land.');
        return;
      }
      setWarn(published.warn || slow);
      setLink(`${location.origin}/cavetto/${published.id}`);
    } catch (e: any) {
      setError(e?.message || 'something slipped.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto">
          <p className="text-[#5ac8fa] text-sm font-medium mb-3">a hollow for reading</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">cavetto</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">A passage, and an optional local file beside it. If you skip the file, the passage itself is written into the share table. Discord unfurls /cavetto/id. Large drops are warned, never refused.</p>
          {saved ? (
            <article className="glass rounded-[28px] p-8 mb-6">
              <h2 className="text-2xl text-white tracking-tight mb-4">{saved.cardTitle || saved.name}</h2>
              <p className="text-neutral-200 leading-8 whitespace-pre-wrap">{saved.caption}</p>
              {saved.url && saved.type && saved.type !== 'text/plain' ? (
                <a href={saved.url} className="inline-flex mt-6 rounded-full bg-white text-black px-4 py-2 text-sm font-medium" download>download the file</a>
              ) : null}
            </article>
          ) : null}
          <div className="glass rounded-[28px] p-6 space-y-4">
            <label className="block text-sm text-neutral-300">
              title
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5ac8fa]/60 transition" placeholder="what the hollow is called" />
            </label>
            <label className="block text-sm text-neutral-300">
              passage
              <textarea value={passage} onChange={(e) => setPassage(e.target.value)} rows={7} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#5ac8fa]/60 transition" placeholder="the reading" />
            </label>
            <label className="block text-sm text-neutral-300">
              local file, optional
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black" />
            </label>
            {file ? <p className="text-xs text-neutral-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB. no size cap.</p> : null}
            {slow ? <p className="text-xs text-[#ff9f0a]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {warn ? <p className="text-xs text-[#ff9f0a]">{warn}</p> : null}
            {link ? <a href={link} className="block text-sm text-[#64b5ff] break-all">{link}</a> : null}
            <button disabled={busy} onClick={hollow} className="w-full rounded-full bg-[#5ac8fa] text-black py-3 text-sm font-medium hover:bg-[#8ad8ff] active:scale-[0.98] transition disabled:opacity-60">{busy ? 'setting…' : 'set the hollow'}</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
