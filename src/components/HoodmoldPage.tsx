import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

const WEATHER = ['dry', 'mist', 'rain', 'clear night', 'low sun'];

export default function HoodmoldPage() {
  const { shareId } = useRouter();
  const [forWhom, setForWhom] = useState('');
  const [weather, setWeather] = useState(WEATHER[0]);
  const [drip, setDrip] = useState('');
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
    let live = true;
    fetchShare(shareId).then((row) => {
      if (live) setSaved(row);
    });
    return () => {
      live = false;
    };
  }, [shareId]);

  async function hang() {
    setError('');
    setLink('');
    if (!forWhom.trim()) {
      setError('name who the drip is for.');
      return;
    }
    if (!file) {
      setError('choose a local file. it lands in the share table.');
      return;
    }
    setBusy(true);
    try {
      const published = await publishLocalFile(file, {
        caption: drip.trim() || `for ${forWhom.trim()}`,
        author: forWhom.trim(),
        cardTitle: `${forWhom.trim()} — hoodmold`,
        color: '#0a84ff',
        meta: { kind: 'hoodmold', forWhom: forWhom.trim(), weather, drip: drip.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      await sbRest(`public_shares?id=eq.${encodeURIComponent(published.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          caption: drip.trim() || `for ${forWhom.trim()}`,
          meta: { kind: 'hoodmold', forWhom: forWhom.trim(), weather, drip: drip.trim(), color: '#0A84FF', cardTitle: `${forWhom.trim()} — hoodmold` },
        }),
      });
      setWarn(published.warn || slow);
      setLink(`${location.origin}/hoodmold/${published.id}`);
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm font-medium mb-3">a drip over the door, not a drawer</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">hoodmold</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Hang one local file for a person, with the weather it should meet. The bytes go to storage and the share table. Discord unfurls /hoodmold/id. Large files get a warning, never a refusal. Older desks stay on their routes.</p>
          {saved ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mb-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">already hung</p>
              <h2 className="text-2xl text-white tracking-tight">{saved.cardTitle || saved.name}</h2>
              <p className="text-neutral-300">{saved.caption || 'no drip note'}</p>
              <p className="text-sm text-neutral-500">{saved.author || 'unsigned'} · {(saved.size / 1024 / 1024).toFixed(2)} MB · no size cap</p>
              {saved.url ? (
                <a href={saved.url} className="inline-flex rounded-full bg-white text-black px-4 py-2 text-sm font-medium" download>download the file</a>
              ) : null}
            </motion.div>
          ) : null}
          <div className="glass rounded-[28px] p-6 space-y-4">
            <label className="block text-sm text-neutral-300">
              for
              <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="who should find this" />
            </label>
            <label className="block text-sm text-neutral-300">
              weather
              <select value={weather} onChange={(e) => setWeather(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none">
                {WEATHER.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-neutral-300">
              drip note
              <input value={drip} onChange={(e) => setDrip(e.target.value)} maxLength={180} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="what the molding should say" />
            </label>
            <label className="block text-sm text-neutral-300">
              local file
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black" />
            </label>
            {file ? <p className="text-xs text-neutral-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB. no size cap.</p> : null}
            {slow ? <p className="text-xs text-[#ff9f0a]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {warn ? <p className="text-xs text-[#ff9f0a]">{warn}</p> : null}
            {link ? (
              <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block text-sm text-[#64b5ff] break-all">{link}</motion.a>
            ) : null}
            <button disabled={busy} onClick={hang} className="w-full rounded-full bg-[#0a84ff] text-white py-3 text-sm font-medium hover:bg-[#409cff] active:scale-[0.98] transition disabled:opacity-60">{busy ? 'hanging…' : 'hang the molding'}</button>
          </div>
          <a href="/gutta" className="inline-block mt-6 text-sm text-neutral-400 hover:text-white transition">see drops already hung</a>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
