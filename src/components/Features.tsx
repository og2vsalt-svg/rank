import { motion } from 'framer-motion';

const features = [
  { title: 'Silk Board', desc: 'Drop local files onto a living board. Each settles with staggered Apple-style springs and becomes its own permanent Discord-ready link under a shared title, caption, and accent. Soft size warnings only.' },
  { title: 'Velvet Ledger', desc: 'Optional password lock and expiry on every share. Local files upload to the share database with polished Discord embeds. Soft size warnings only.' },
  { title: 'Orbit Bundle', desc: 'Drop several local files. Each becomes its own Discord-ready share, plus a single markdown catalog that links them all under one title.' },
  { title: 'Whisper Capsule', desc: 'Write a quiet note, optionally attach a file, and set an unlock time. Publishes as a permanent Discord-ready share with soft size warnings only.' },
  { title: 'Glass Receipt', desc: 'Structured line items, currency, totals, and optional attachment. Publish the whole receipt as a clean Discord-ready markdown share.' },
  { title: 'Quiet Harbor', desc: 'Shape title, caption, and accent, then drop multiple local files. Each uploads to the share database and becomes a permanent Discord-ready link with a live embed preview.' },
  { title: 'Silk Mosaic', desc: 'Weave local images into a living board. Publish each as its own Discord-ready share under one quiet title and caption.' },
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
