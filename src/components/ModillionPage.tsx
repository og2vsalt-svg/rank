import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function ModillionPage() {
  const { shareId } = useRouter();
  const [forId, setForId] = useState('');
  const [thanks, setThanks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [parent, setParent] = useState<any>(null);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'large file. sending may feel slow. nothing is refused.' : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(async (row) => {
      setSaved(row);
      const parentId = row?.meta?.thanksFor;
      if (parentId) setParent(await fetchShare(parentId));
    });
  }, [shareId]);

  async function leaveBracket() {
    setError('');
    setLink('');
    setWarn('');
    const id = forId.trim();
    if (!id || !thanks.trim()) {
      setError('the share id, and a short thanks. a file is optional.');
      return;
    }
    const existing = await fetchShare(id);
    if (!existing) {
      setError('that share is not on the table.');
      return;
    }
    setBusy(true);
    try {
      const caption = `thanks for ${existing.name || id}: ${thanks.trim()}`;
      const payload = file || new File([caption + '\n'], 'modillion.txt', { type: 'text/plain' });
      const published = await publishLocalFile(payload, {
        caption,
        cardTitle: `thanks · ${existing.name || id}`,
        color: '#ff9f0a',
        meta: { kind: 'modillion', thanksFor: id, thanks: thanks.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the bracket did not land.');
        return;
      }
      setWarn(published.warn || slow);
      setLink(`${location.origin}/modillion/${published.id}`);
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
          <p className="text-[#ff9f0a] text-sm font-medium mb-3">a small bracket under a share</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">modillion</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Thank someone for a share that already exists. The thanks lands in the share table. An optional local file can ride along. Discord unfurls /modillion. Large drops are warned, never refused. Nothing older is removed.</p>
          {saved ? (
            <div className="glass rounded-[28px] p-8 mb-6">
              <p className="text-xl text-white leading-relaxed">{saved.meta?.thanks || saved.caption}</p>
              {parent ? <a href={`/s/${parent.id}`} className="inline-block mt-4 text-sm text-[#ffb340]">the share it thanks · {parent.name}</a> : null}
              {saved.file_url ? <a href={saved.file_url} className="block mt-2 text-sm text-[#ffb340]">open the attached file</a> : null}
            </div>
          ) : null}
          <div className="glass rounded-[28px] p-6 grid gap-3">
            <input value={forId} onChange={(e) => setForId(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#ff9f0a]/70 transition" placeholder="share id you are thanking" />
            <textarea value={thanks} onChange={(e) => setThanks(e.target.value)} rows={3} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#ff9f0a]/70 transition resize-none" placeholder="a short thanks" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-neutral-400" />
            {slow ? <p className="text-sm text-[#ffd60a]">{slow}</p> : null}
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {link ? <a href={link} className="text-sm text-[#64b5ff] break-all">{link}</a> : null}
            <button disabled={busy} onClick={leaveBracket} className="rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">{busy ? 'leaving…' : 'leave the bracket'}</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
