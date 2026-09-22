import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function ago(iso: string) {
  const d = Date.now() - +new Date(iso);
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return Math.floor(d / 60_000) + 'm ago';
  if (d < 86_400_000) return Math.floor(d / 3_600_000) + 'h ago';
  return Math.floor(d / 86_400_000) + 'd ago';
}

export default function TracePage() {
  const { activity, files, ready } = useVault();
  const { navigate } = useRouter();
  const publicOnes = files.filter((f) => f.public);

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
          <p className="text-[#0a84ff] text-sm mb-2">trace</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">what just happened.</h1>
          <p className="text-neutral-400 text-sm mb-8">local activity only. no analytics pixel. no hard file caps, just a note if a drop is huge.</p>

          {!ready ? (
            <p className="text-sm text-neutral-500">warming the vault…</p>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">live public drops</p>
                {publicOnes.length === 0 ? (
                  <p className="text-sm text-neutral-500">nothing public yet. flip a file live from the vault.</p>
                ) : (
                  <ul className="space-y-2">
                    {publicOnes.slice(0, 12).map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{f.name}</p>
                          <p className="text-xs text-neutral-500">{f.folder} · {f.cloudSynced ? 'cloud' : 'local'} · {f.downloads} opens</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => navigate('share', f.id)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">open</button>
                          <button onClick={() => navigator.clipboard.writeText(shareUrls(f.id).embed)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">embed</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">activity</p>
                {activity.length === 0 ? (
                  <p className="text-sm text-neutral-500">quiet so far.</p>
                ) : (
                  <ul className="space-y-2">
                    {activity.map((e) => (
                      <li key={e.id} className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-neutral-300">{e.text}</span>
                        <span className="text-xs text-neutral-600 shrink-0">{ago(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
