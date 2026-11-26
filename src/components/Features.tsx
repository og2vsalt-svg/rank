import { motion } from 'framer-motion';

const features = [
  { title: 'Horizon Forge', desc: 'Shape title, caption, accent, and optional expiry, then drop multiple local files. Each uploads to the share database and becomes a permanent Discord-ready link. Soft size warnings only.' },
  { title: 'Lumen Vault', desc: 'Quiet multi-file hosting with living gallery previews. Each local file uploads to the share database and becomes its own permanent Discord-ready link. Soft size warnings only.' },
  { title: 'Vault Pulse', desc: 'Multi-file hosting with live progress. Each local file uploads to the share database and becomes its own permanent Discord-ready link. Soft size warnings only.' },
  { title: 'Discord Studio', desc: 'Shape title and caption for the embed, preview it, then publish a professional share link. Every share is Discord-ready.' },
  { title: 'Quiet desks', desc: 'Dozens of specialized surfaces for files, notes, sketches, signatures, moods, and more. Prior desks remain fully intact.' },
  { title: 'Soft warnings only', desc: 'Large files are warned about possible slowness. Never refused. No hard limits.' },
  { title: 'Apple-style motion', desc: 'Spring animations, frosted glass, and careful pacing that feels hand-crafted and human.' },
  { title: 'Local + cloud', desc: 'Keep everything in the browser vault. Publish only what you choose. Shares live in Supabase. File sharing uploads local files straight to the database.' },
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
