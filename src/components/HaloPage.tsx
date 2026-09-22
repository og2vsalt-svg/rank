import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function fmt(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function HaloPage() {
  const { files } = useVault();
  const { navigate } = useRouter();

  const publicOnes = useMemo(() => files.filter((f) => f.public), [files]);
  const expiring = publicOnes.filter((f) => f.expiresAt && +new Date(f.expiresAt) - Date.now() < 1000 * 60 * 60 * 24 * 3);
  const locked = publicOnes.filter((f) => f.lockPass);
  const heavy = publicOnes.filter((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">halo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how your public drops are doing.</h1>
          <p className="text-neutral-400 text-sm mb-6">expiry, locks, and chunky files. copy the discord embed url from here.</p>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              [publicOnes.length, 'live'],
              [expiring.length, 'soon'],
              [locked.length, 'locked'],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-2xl bg-white/[0.03] border border-white/5 px-3 py-4 text-center">
                <p className="text-2xl font-semibold tracking-tight">{n}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{l}</p>
              </div>
            ))}
          </div>

          {heavy.length > 0 && (
            <p className="text-xs text-amber-400/80 mb-4">{heavy.length} public file{heavy.length === 1 ? '' : 's'} over 40mb. previews may crawl. still allowed.</p>
          )}

          {publicOnes.length === 0 ? (
            <p className="text-sm text-neutral-500">nothing public yet. mark a vault file public or use drop.</p>
          ) : (
            <ul className="space-y-2">
              {publicOnes.slice(0, 40).map((f) => (
                <li key={f.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {fmt(f.size)}
                    {f.lockPass ? ' · locked' : ''}
                    {f.expiresAt ? ' · exp ' + new Date(f.expiresAt).toLocaleDateString() : ''}
                    {' · ' + (f.downloads || 0) + ' dl'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrls(f.id).embed)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5"
                    >
                      copy discord link
                    </button>
                    <button onClick={() => navigate('share', f.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">open</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
