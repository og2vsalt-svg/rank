import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function TransitPage() {
  const { navigate } = useRouter();
  const [id, setId] = useState('');
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">transit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">open a public drop by id.</h1>
          <p className="text-sm text-neutral-500 mb-6">paste a share id from discord or a friend. no vault required.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const clean = id.trim().replace(/^.*[?&]f=/, '').replace(/[^a-z0-9_-]/gi, '');
              if (clean) navigate('share', clean);
            }}
          >
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
