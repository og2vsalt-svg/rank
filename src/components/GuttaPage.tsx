import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  file_url?: string;
  caption?: string;
  author?: string;
  meta?: { kind?: string; forWhom?: string; weather?: string; drip?: string };
  created_at?: string;
};

export default function GuttaPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    sbRest('public_shares?select=id,name,mime,size,file_url,caption,author,meta,created_at&order=created_at.desc&limit=60')
      .then(async (res) => {
        if (!res.ok) throw new Error('the board did not answer');
        const data = await res.json();
        if (!live) return;
        const list = (Array.isArray(data) ? data : []).filter((row) => row?.meta?.kind === 'hoodmold');
        setRows(list);
      })
      .catch((e) => live && setError(e?.message || 'could not read the board'));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#64d2ff] text-sm font-medium mb-3">drops under the molding</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">gutta</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">The public index of hoodmolds already filed. Open one to read the drip and download the file. Discord unfurls /gutta. Not a cabinet.</p>
          {error ? <p className="text-sm text-[#ff453a] mb-4">{error}</p> : null}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.a key={row.id} href={`/hoodmold/${row.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform">
                <div>
                  <p className="text-white font-medium">{row.meta?.forWhom || row.name}</p>
                  <p className="text-sm text-neutral-400 mt-1">{row.meta?.drip || row.caption || 'no drip note'} · {row.meta?.weather || 'weather unset'}</p>
                </div>
                <span className="text-xs text-neutral-500 shrink-0">{((row.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
              </motion.a>
            ))}
            {!error && rows.length === 0 ? <p className="text-sm text-neutral-500">nothing hung yet. the older desks are still on their routes.</p> : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
