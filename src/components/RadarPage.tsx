import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} mb`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} gb`;
}

export default function RadarPage() {
  const { files, trash, usedBytes, activity, folders } = useVault();
  const { navigate } = useRouter();
  const publicCount = files.filter((f) => f.public).length;
  const types = files.reduce<Record<string, number>>((acc, f) => {
    const k = (f.type || 'file').split('/')[0] || 'file';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">radar</p>
          <h1 className="text-3xl font-semibold mb-2">live pulse of your vault.</h1>
          <p className="text-neutral-400 text-sm mb-8">not another drop zone. just a quiet readout of what you already host.</p>
          <div className="grid sm:grid-cols-4 gap-3 mb-8">
            {[
              ['files', String(files.length)],
              ['public', String(publicCount)],
              ['folders', String(folders.length)],
              ['used', pretty(usedBytes)],
            ].map(([k, v]) => (
              <div key={k} className="glass rounded-3xl p-5">
                <p className="text-xs text-neutral-500 mb-1">{k}</p>
                <p className="text-2xl font-semibold tracking-tight">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-[28px] p-6">
              <p className="text-sm text-neutral-400 mb-4">kinds</p>
              {Object.keys(types).length === 0 && <p className="text-sm text-neutral-500">empty vault.</p>}
              <div className="space-y-2">
                {Object.entries(types).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{k}</span>
                    <span className="text-neutral-500">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-[28px] p-6">
              <p className="text-sm text-neutral-400 mb-4">recent</p>
              <div className="space-y-3 max-h-64 overflow-auto">
                {activity.slice(0, 12).map((a) => (
                  <p key={a.id} className="text-sm text-neutral-300">
                    <span className="text-neutral-600 text-xs mr-2">{new Date(a.at).toLocaleTimeString()}</span>
                    {a.text}
                  </p>
                ))}
                {activity.length === 0 && <p className="text-sm text-neutral-500">quiet so far.</p>}
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-6">{trash.length} in trash · <button className="text-[#0a84ff]" onClick={() => navigate('vault')}>open vault</button></p>
        </motion.div>
      </div>
    </div>
  );
}
