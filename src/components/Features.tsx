import { motion } from 'framer-motion';

const features = [
  { title: 'Velvet Note', desc: 'Write a pure text note or attach a local file. Shape the Discord embed title, caption, and accent with live preview, then publish. It lands in the public_shares table as a permanent Discord-ready link. Soft size warnings only — no hard limits.' },
  { title: 'Quiet Note', desc: 'Write a pure text note or attach a local file. It lands in the public_shares table as a permanent Discord-ready link with professional embeds. Soft size warnings only.' },
  { title: 'Velvet Horizon', desc: 'Shape a shared title, caption, and accent, then drop one or many local files. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits.' },
  { title: 'Lumen Constellation', desc: 'Drop local files. They settle into a living constellation with Apple-style springs and connecting light. Each becomes its own permanent Discord-ready link under a shared title and accent. Soft size warnings only — no hard limits.' },
  { title: 'Lumen Palette', desc: 'Drop local images. A living palette settles with Apple-style springs from the light inside. Publish each as its own permanent Discord-ready link with the colors in the caption. Soft size warnings only.' },
  { title: 'Aether Archive', desc: 'Living multi-file drop with shared title, caption, and accent. Files settle into a gallery of recent shares. Soft size warnings only. Every link ships with a polished Discord embed.' },
  { title: 'Quiet Prism', desc: 'Shape a shared title, caption, and accent, then drop multiple local files. They settle with staggered Apple-style springs and each becomes its own permanent Discord-ready link. Soft size warnings only.' },
  { title: 'Silk Board', desc: 'Drop local files onto a living board. Each settles with staggered Apple-style springs and becomes its own permanent Discord-ready link under a shared title, caption, and accent. Soft size warnings only.' },
  { title: 'Velvet Ledger', desc: 'Optional password lock and expiry on every share. Local files upload to the share database with polished Discord embeds. Soft size warnings only.' },
  { title: 'Orbit Bundle', desc: 'Drop several local files. Each becomes its own Discord-ready share, plus a single markdown catalog that links them all under one title.' },
  { title: 'Soft warnings only', desc: 'Large files are warned about possible slowness. Never refused. No hard limits.' },
  { title: 'Apple-style motion', desc: 'Spring animations, frosted glass, and careful pacing that feels hand-crafted and human.' },
];

export default function Features() {
  return (
    <section className="py-20 px-5">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-semibold tracking-tight text-center mb-12"
        >
          everything stays quiet until you share
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6"
            >
              <h3 className="text-lg font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
