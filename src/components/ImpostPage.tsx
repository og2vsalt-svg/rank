import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ImpostPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'large file. sending may feel slow. nothing is refused.' : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setSaved);
  }, [shareId]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const revealAt = saved?.meta?.revealAt ? Date.parse(saved.meta.revealAt) : 0;
  const sealed = revealAt && now < revealAt;

  async function setBlock() {
    setError('');
    setLink('');
    setWarn('');
    if (!title.trim() || !note.trim()) {
      setError('a title and a line. the file is optional.');
      return;
    }
    setBusy(true);
    try {
      const body = `${title.trim()}\n\n${note.trim()}\n`;
      const payload = file || new File([body], 'impost.txt', { type: 'text/plain' });
      const published = await publishLocalFile(payload, {
        caption: note.trim(),
        cardTitle: title.trim(),
        color: '#64d2ff',
        expiresAt: when ? new Date(when).toISOString() : undefined,
        meta: { kind: 'impost', revealAt: when ? new Date(when).toISOString() : null, title: title.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the block did not land.');
        return;
      }
      setWarn(published.warn || slow);
      setLink(`${location.origin}/impost/${published.id}`);
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
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#64d2ff] text-sm font-medium mb-3">a block over the opening</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">impost</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Leave a line that stays quiet until a time you pick. An optional local file lands in the share table. Discord unfurls /impost. Large drops are warned, never refused. The older desks stay.</p>
          {saved ? (
            <div className="glass rounded-[28px] p-8 mb-6">
              {sealed ? (
                <>
                  <p className="text-sm text-neutral-500 mb-2">sealed until</p>
                  <p className="text-2xl text-white tracking-tight">{new Date(revealAt).toLocaleString()}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-500 mb-2">{saved.meta?.title || saved.name}</p>
                  <p className="text-xl text-white leading-relaxed">{saved.caption}</p>
                  {saved.file_url ? <a href={saved.file_url} className="inline-block mt-4 text-sm text-[#64d2ff]">open the file</a> : null}
                </>
              )}
            </div>
          ) : null}
          <div className="glass rounded-[28px] p-6 grid gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#64d2ff]/70 transition" placeholder="what it is called" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#64d2ff]/70 transition resize-none" placeholder="the line under the block" />
            <label className="text-xs text-neutral-500">open after (optional)</label>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#64d2ff]/70 transition" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-neutral-400" />
            {slow ? <p className="text-sm text-[#ffd60a]">{slow}</p> : null}
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {link ? <a href={link} className="text-sm text-[#64b5ff] break-all">{link}</a> : null}
            <button disabled={busy} onClick={setBlock} className="rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">{busy ? 'setting…' : 'set the block'}</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
