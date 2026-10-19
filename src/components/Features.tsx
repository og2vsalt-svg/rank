import { motion } from 'framer-motion';

const items = [
  { title: 'softlumenveil', href: '/softlumenveil', body: 'soft rising lumen veils for what you carry. multi-file drop with shared note and accent color, quiet horizontal veils of light that rise, breathe, and fade in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softlumenveil. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softcanopy', href: '/softcanopy', body: 'quiet floating canopy of light leaves for what you carry. multi-file drop with shared note and accent color, soft oval leaves that gently drift, rotate, and breathe across the space in your color, like a quiet canopy. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcanopy. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softcrystal', href: '/softcrystal', body: 'quiet crystalline facets for what you carry. multi-file drop with shared note and accent color, soft hexagonal crystal facets that slowly rotate, breathe, and refract light in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcrystal. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softaurora', href: '/softaurora', body: 'soft flowing aurora curtains for what you carry. multi-file drop with shared note and accent color, soft horizontal ribbons of light that drift, breathe, and gently wave across the space in your color, like quiet aurora curtains, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softaurora. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softlantern', href: '/softlantern', body: 'quiet flickering lantern for what you carry. multi-file drop with shared note and accent color, a soft central lantern that gently flickers and breathes, with quiet orbiting sparks of your color, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softlantern. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quietmeadow', href: '/quietmeadow', body: 'quiet growing meadow of light for what you carry. multi-file drop with shared note and accent color, soft blades of light that gently grow, sway, and breathe upward in your color, like a quiet meadow, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quietmeadow. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softfirefly', href: '/softfirefly', body: 'quiet drifting fireflies for what you carry. multi-file drop with shared note and accent color, soft points of light that drift, pulse, and gently wander across the space in your color, like quiet fireflies, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softfirefly. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softglimmer', href: '/softglimmer', body: 'soft twinkling glimmers for what you carry. multi-file drop with shared note and accent color, soft points of light that twinkle, drift, and breathe with your color, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softglimmer. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'lumenweave', href: '/lumenweave', body: 'soft weaving light threads for what you carry. multi-file drop with shared note and accent color, gentle horizontal and vertical light threads that weave and breathe with your color, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /lumenweave. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'dawnveil', href: '/dawnveil', body: 'soft rising dawn light veils for what you carry. multi-file drop with shared note and accent color, gentle rising veils that lift and fade with your color, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /dawnveil. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quietbloom', href: '/quietbloom', body: 'soft blooming orbs for what you carry. multi-file drop with shared note and accent color, gentle blooming light orbs that rise and fade with your color, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quietbloom. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'abacus', href: '/abacus', body: 'lay one local file on a counting slab and name how many arrivals you expect. bytes land in storage and the share table. discord unfurls /abacus. large drops are warned, never refused. not a vault drawer. older desks stay.' },
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
