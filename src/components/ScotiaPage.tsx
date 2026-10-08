import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { useRouter } from './Router';
import { useEffect } from 'react';

export default function ScotiaPage() {
  const { shareId } = useRouter();
  const [mood, setMood] = useState('evening');
  const [minutes, setMinutes] = useState('12');
  const [where, setWhere] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [saved, setSaved] = useState<any>(null);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'large file. the send may feel slow. nothing is refused.' : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setSaved);
  }, [shareId]);

  async function leaveHollow() {
    setError('');
    setLink('');
    setWarn('');
    if (!where.trim()) {
      setError('where you were listening. the file is optional.');
      return;
    }
    setBusy(true);
    try {
      const caption = `${mood} · ${minutes || '0'} min · ${where.trim()}`;
      const payload = file || new File([caption + '\n'], 'scotia.txt', { type: 'text/plain' });
      const published = await publishLocalFile(payload, {
        caption,
        cardTitle: where.trim(),
        color: '#bf5af2',
        meta: { kind: 'scotia', mood, minutes, where: where.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the hollow did not land.');
        return;
      }
      setWarn(published.warn || slow);
      setLink(`${location.origin}/scotia/${published.id}`);
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
          <p className="text-[#bf5af2] text-sm font-medium mb-3">a hollow for a listening</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">scotia</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Note where you listened, for how long, and in what mood. An optional local file — a recording, a photo, a note — lands in the share table. Discord unfurls /scotia. Large drops are warned, never refused.</p>
          {saved ? (
            <div className="glass rounded-[28px] p-8 mb-6">
              <p className="text-2xl text-white tracking-tight mb-2">{saved.meta?.where || saved.name}</p>
              <p className="text-neutral-400">{saved.caption}</p>
              {saved.file_url ? <a href={saved.file_url} className="inline-block mt-4 text-sm text-[#d0a2ff]">open the file</a> : null}
            </div>
          ) : null}
          <div className="glass rounded-[28px] p-6 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none">
                {['morning', 'evening', 'rain', 'quiet', 'crowd'].map((m) => <option key={m}>{m}</option>)}
              </select>
              <input value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none" placeholder="minutes" />
            </div>
            <input value={where} onChange={(e) => setWhere(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#bf5af2]/70 transition" placeholder="where you were" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-neutral-400" />
            {slow ? <p className="text-sm text-[#ffd60a]">{slow}</p> : null}
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {link ? <a href={link} className="text-sm text-[#64b5ff] break-all">{link}</a> : null}
            <button disabled={busy} onClick={leaveHollow} className="rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">{busy ? 'leaving…' : 'leave the hollow'}</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
