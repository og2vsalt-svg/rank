import { motion } from 'framer-motion';

const items = [
  {
    title: 'local-first vault',
    body: 'files live in your browser for this demo. nothing ships to a random box unless you copy a public link.',
  },
  {
    title: 'folders + favorites + pins',
    body: 'inbox by default. make folders, star keepers, pin the ones that should float to the top.',
  },
  {
    title: 'quiet share links',
    body: 'mark a file public and copy a hash link. optional expiry so the drop dies on its own.',
  },
  {
    title: 'paste or drop',
    body: 'cmd/ctrl-v a screenshot or file right into the vault. drag works too.',
  },
  {
    title: 'tags + notes',
    body: 'label dumps so search actually finds them later. notes sit on the preview sheet.',
  },
  {
    title: 'no hard file cap',
    body: 'drop whatever size you want. we only warn when a file is so big the tab might feel sleepy.',
  },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a vault that feels like it belongs on a phone.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl p-6"
            >
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
