import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Pin = { id: string; place?: string | null; reading?: string | null; file_name?: string | null; pretty?: string | null; size?: number; author?: string | null };

export default function VoussoirPage() {
  const { navigate } = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/keystone?list=1').then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not read the arch');
      setPins(data.pins || []);
    }).catch((err) => setError(err instanceof Error ? err.message : 'could not read the arch'));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium tracking-wide text-[#6e6e73]">rankvault · voussoir</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Pins already set.</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">The public arch of keystones. Open one for the file and the reading. Paste /voussoir in Discord for the card. Not a cabinet.</p>
        <button type="button" onClick={() => navigate('keystone')} className="mt-6 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black active:scale-[0.98]">Set a pin</button>
        {error ? <p className="mt-6 text-sm text-[#b42318]">{error}</p> : null}
        <div className="mt-8 space-y-3">
          {pins.map((pin, i) => (
            <motion.button key={pin.id} type="button" onClick={() => navigate('keystone', pin.id)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="block w-full rounded-[24px] bg-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5">
              <p className="text-lg font-semibold tracking-tight">{pin.place}</p>
              {pin.reading ? <p className="mt-1 text-sm text-[#6e6e73]">{pin.reading}</p> : null}
              <p className="mt-2 text-xs text-[#86868b]">{pin.file_name || 'file'} · {pin.pretty || ''}{pin.author ? ` · ${pin.author}` : ''}</p>
            </motion.button>
          ))}
          {!error && pins.length === 0 ? <p className="text-sm text-[#6e6e73]">No pins yet.</p> : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
