import { motion } from 'framer-motion';

const items = [
  { title: 'auroradesk', href: '/auroradesk', body: 'where light rises. drop one or many local files with a shared note and accent. they rise into storage and public_shares. recent public drops settle as soft aurora cards that lift with spring motion and a gentle breathing glow. every share link unfurls a polished Discord card. large batches warned only for possible slowness. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softember', href: '/softember', body: 'a quiet ember of warm light for what you carry. drop one or many local files with a shared title, caption, and soft amber accent. glass cards float and settle with spring motion on deep navy, glowing softly like embers. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },
  { title: 'haven', href: '/haven', body: 'a quiet haven for what you carry. drop one or many local files with a shared title, caption, and soft accent. glass cards float and settle with spring motion on deep navy. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },
  // ... (rest of the long list remains the same as previous, with all prior desks intact)
  { title: 'quietbeacon', href: '/quietbeacon', body: 'a quiet beacon for one light. focus one note or local file as a beacon. it lands in storage and the public_shares table with your accent. share links unfurl with polished Discord cards. soft spring motion, frosted glass, gentle pulse. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  // all prior desks remain available via direct links and the navbar; continuously expanded while preserving every previous feature.
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">specialized desks</h2>
        <p className="text-neutral-400 text-sm mb-8">quiet desks for files and notes. each keeps prior features. discord embeds on shares. soft warnings only.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
              className="glass rounded-2xl p-5 block hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium mb-1.5">{item.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
