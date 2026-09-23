import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

const PRESETS = [
  { label: 'clean blue', color: '#0A84FF', title: 'rankvault drop', desc: 'private file hosting. share only if you want.' },
  { label: 'dusk', color: '#AF52DE', title: 'dusk drop', desc: 'a quiet public file. open when you are ready.' },
  { label: 'mint', color: '#30D158', title: 'fresh share', desc: 'just landed in the cloud table.' },
];

export default function OrbitPage() {
  const [id, setId] = useState('');
  const [preset, setPreset] = useState(0);
  const p = PRESETS[preset];
  const urls = useMemo(() => (id.trim() ? shareUrls(id.trim()) : { embed: '', app: '' }), [id]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">orbit</p>
          <h1 className="text-3xl font-semibold mb-3">spin a discord embed.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick a vibe, paste the share id, copy the /s/ url. discord scrapes that path, not the hash route.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {PRESETS.map((item, i) => (
              <button
                key={item.label}
                onClick={() => setPreset(i)}
                className={`px-3.5 py-1.5 rounded-full text-sm border ${i === preset ? 'bg-white text-black border-transparent' : 'bg-white/5 border-white/10 text-neutral-300'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31] mb-6">
            <div className="flex">
              <div className="w-1" style={{ background: p.color }} />
              <div className="p-4 flex-1">
                <p className="text-[#00a8fc] text-xs mb-1">rankvault</p>
                <p className="text-white font-semibold text-sm mb-1">{p.title}</p>
                <p className="text-[#dbdee1] text-sm mb-3">{p.desc}</p>
                <div className="h-28 rounded-xl" style={{ background: `linear-gradient(135deg, ${p.color}66, #111 80%)` }} />
              </div>
            </div>
          </div>
          <p className="text-[12px] text-neutral-500 break-all mb-4">{urls.embed || 'needs an id'}</p>
          <button
            disabled={!urls.embed}
            onClick={() => urls.embed && navigator.clipboard.writeText(urls.embed)}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            copy embed url
          </button>
        </motion.div>
      </div>
    </div>
  );
}
