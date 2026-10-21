import { motion } from 'framer-motion';

const items = [
  { title: 'chronicle', href: '/chronicle', body: 'a quiet public record of what has been shared. browse recent public shares from every desk in a clean glass grid, or drop local files directly into the chronicle. each landing creates a polished Discord embed. large files warned, never refused. spring motion, glass surfaces. prior features preserved. no traces of boosting.' },
  { title: 'softquasar', href: '/softquasar', body: 'quiet radiating quasar for what you carry. multi-file drop with shared note and accent color, soft beams of light that gently radiate outward from a still center, pulse, and breathe in your color, like a quiet quasar flaring in deep space. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softquasar. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softorbit', href: '/softorbit', body: 'quiet orbits for what you carry. multi-file drop with shared note and accent color, soft lights that gently orbit a still center, breathing and drifting in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softorbit. large drops warned, never refused. prior features preserved. no traces of boosting.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">specialized desks</h2>
        <p className="text-neutral-400 mb-10">each treats a file or note differently. all land in the database with professional Discord embeds.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-5 block hover:bg-white/[0.06] transition"
            >
              <h3 className="font-medium text-white mb-1">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
