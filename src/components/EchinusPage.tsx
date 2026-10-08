import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, fetchShare } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function EchinusPage() {
  const { shareId } = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [saved, setSaved] = useState<any>(null);

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setSaved);
  }, [shareId]);

  async function setCushion() {
    setError('');
    const words = [a, b, c].map((w) => w.trim()).filter(Boolean);
    if (words.length < 3) {
      setError('three words. short is fine.');
      return;
    }
    setBusy(true);
    try {
      const text = words.join(' · ');
      const file = new File([text + '\n'], 'echinus.txt', { type: 'text/plain' });
      const published = await publishLocalFile(file, {
        caption: text,
        cardTitle: text,
        color: '#ffd60a',
        meta: { kind: 'echinus', words: text },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the cushion did not land.');
        return;
      }
      setLink(`${location.origin}/echinus/${published.id}`);
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#ffd60a] text-sm font-medium mb-3">a cushion, not a cabinet</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">echinus</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">Three words, filed as a small note in the share table. No upload from disk. Discord unfurls /echinus/id. The file desks stay where they are.</p>
          {saved ? (
            <div className="glass rounded-[28px] p-8 mb-6 text-center">
              <p className="text-3xl text-white tracking-tight">{saved.caption || saved.name}</p>
            </div>
          ) : null}
          <div className="glass rounded-[28px] p-6 grid grid-cols-3 gap-3">
            {[a, b, c].map((value, i) => (
              <input key={i} value={value} onChange={(e) => [setA, setB, setC][i](e.target.value)} maxLength={24} className="rounded-2xl bg-black/40 border border-white/10 px-3 py-3 text-white text-center outline-none focus:border-[#ffd60a]/70 transition" placeholder={['warm', 'quiet', 'held'][i]} />
            ))}
            {error ? <p className="col-span-3 text-sm text-[#ff453a]">{error}</p> : null}
            {link ? <a href={link} className="col-span-3 text-sm text-[#64b5ff] break-all">{link}</a> : null}
            <button disabled={busy} onClick={setCushion} className="col-span-3 rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">{busy ? 'setting…' : 'set the cushion'}</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
