import { motion } from 'framer-motion';

const features = [
  { title: 'Quiet desks', desc: 'Dozens of specialized surfaces for files, notes, sketches, signatures, moods, whispers, collages, mosaics, annotations, timestamps, palettes, and handoffs. Each settles into the database with a polished Discord embed on every link. Silk Desk, Frost Desk, Lumen Gallery, and Orbit Path join the collection.' },
  { title: 'Soft warnings only', desc: 'Large files are warned about possible slowness. Never refused. No hard limits.' },
  { title: 'Apple-style motion', desc: 'Spring animations, frosted glass, and careful pacing that feels hand-crafted and human.' },
  { title: 'Local + cloud', desc: 'Keep everything in the browser vault. Publish only what you choose. Shares live in Supabase with optional Blob. File sharing uploads local files straight to the database.' },
  { title: 'Discord ready', desc: 'Every share link is prepared with professional Open Graph cards so Discord, Twitter, and others show a clean preview.' },
  { title: 'Always expanding', desc: 'New desks appear while every prior surface remains fully intact. Centralized around private file hosting. No boosting. Silk Desk, Frost Desk, Lumen Gallery, Orbit Path, Signature Desk, Mood Board, Whisper Note, and many more.' },
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
