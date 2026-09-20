import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function StatusPage() {
  const vault = useVault() as any;
  const count = vault?.files?.length ?? 0;
  const bytes = (vault?.files || []).reduce((a: number, f: any) => a + (f.size || 0), 0);

  const pills = [
    { label: 'vault files', value: String(count) },
    { label: 'local bytes', value: bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' kb' : (bytes / 1024 / 1024).toFixed(2) + ' mb' },
    { label: 'file cap', value: 'none' },
    { label: 'share links', value: 'on' },
    { label: 'notes desk', value: 'live' },
    { label: 'paste desk', value: 'live' },
  ];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">status</p>
          <h1 className="text-3xl font-semibold mb-3">everything quiet.</h1>
          <p className="text-neutral-400 text-sm mb-8">no boost stuff. just a pulse on what this origin is holding locally.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {pills.map((p) => (
              <div key={p.label} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4">
                <p className="text-xs text-neutral-500 mb-1">{p.label}</p>
                <p className="text-xl font-medium">{p.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
