import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls } from '../lib/cloudShare';

export default function ShareTimelinePage() {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(60).then(setShares).finally(() => setLoading(false));
  }, []);

  const grouped = shares.reduce((acc: any, s) => {
    const day = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'recent';
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-7 mb-8"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#AF52DE] mb-2">sharetimeline</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet timeline of what has been shared</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Chronological view of public shares from every desk. Soft glass rows with spring motion. Different from a plain vault or ledger — organized by day. Discord embeds on every link. Files live in the database. Large files warned only elsewhere. Prior features preserved.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500 text-sm py-12">gathering the timeline…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-12">nothing yet.</div>
        ) : (
          Object.entries(grouped).map(([day, items]: [string, any]) => (
            <div key={day} className="mb-8">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">{day}</p>
              <div className="space-y-3 pl-4 border-l border-white/10">
                {items.map((s: any, i: number) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).app}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 140, damping: 18 }}
                    className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
                  >
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{s.caption || 'shared quietly'}</p>
                    <p className="text-xs text-neutral-600 mt-1">{(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  </motion.a>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
