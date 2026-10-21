import { motion } from 'framer-motion';

const items = [
  { title: 'softflare', href: '/softflare', body: 'quiet flaring bursts of light for what you carry. multi-file drop with shared note and accent color, soft expanding flares that gently burst, fade, and breathe in your color, like quiet solar flares. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softflare. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quietbeam', href: '/quietbeam', body: 'quiet beams of light for what you carry. multi-file drop with shared note and accent color, soft vertical beams that gently breathe, rise, and settle in your color, like quiet pillars of luminescence. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quietbeam. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softwave', href: '/softwave', body: 'quiet undulating waves for what you carry. multi-file drop with shared note and accent color, soft horizontal waves of light that gently undulate, breathe, and drift in your color, like quiet currents of luminescence. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softwave. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'auroraweave', href: '/auroraweave', body: 'quiet weaving aurora of light for what you carry. multi-file drop with shared note and accent color, soft luminous ribbons that gently weave, undulate, and shimmer in your color, like quiet northern lights folding through the dark. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /auroraweave. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softpetal', href: '/softpetal', body: 'quiet blooming petals of light for what you carry. multi-file drop with shared note and accent color, soft petals of light that gently open, breathe, and fade in your color, like quiet flowers unfolding. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softpetal. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softripple', href: '/softripple', body: 'quiet concentric ripples of light for what you carry. multi-file drop with shared note and accent color, soft expanding rings that gently pulse outward and fade in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softripple. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softhelix', href: '/softhelix', body: 'quiet helical paths of light for what you carry. multi-file drop with shared note and accent color, soft points that spiral and breathe in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softhelix. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softprism', href: '/softprism', body: 'light refracted through what you carry. multi-file drop with shared note and accent color, soft prismatic beams that fan, breathe, and shift in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softprism. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quietledger', href: '/quietledger', body: 'a quiet searchable record of public shares from every desk. soft glass rows, spring motion, filter by name or size. each link carries a polished Discord embed. files live in the database. different from a plain vault. prior desks remain. large files only warned elsewhere.' },
  { title: 'softcomet', href: '/softcomet', body: 'drifting comet tails of light for what you carry. multi-file drop with shared note and accent color, soft trailing streaks that drift across and fade in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcomet. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softlumenveil', href: '/softlumenveil', body: 'soft rising lumen veils for what you carry. multi-file drop with shared note and accent color, quiet horizontal veils of light that rise, breathe, and fade in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softlumenveil. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softcanopy', href: '/softcanopy', body: 'quiet floating canopy of light leaves for what you carry. multi-file drop with shared note and accent color, soft oval leaves that gently drift, rotate, and breathe across the space in your color, like a quiet canopy. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcanopy. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softcrystal', href: '/softcrystal', body: 'quiet crystalline facets for what you carry. multi-file drop with shared note and accent color, soft hexagonal crystal facets that slowly rotate, breathe, and refract light in your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcrystal. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softaurora', href: '/softaurora', body: 'soft flowing aurora curtains for what you carry. multi-file drop with shared note and accent color, soft horizontal ribbons of light that drift, breathe, and gently wave across the space in your color, like quiet aurora curtains, spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softaurora. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softlantern', href: '/softlantern', body: 'quiet flickering lantern for what you carry. multi-file drop with shared note and accent color, a soft central lantern that gently flickers and breathes, with quiet orbiting sparks of your color. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softlantern. large drops warned, never refused. prior features preserved. no traces of boosting.' },
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
