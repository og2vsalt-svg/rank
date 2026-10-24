import { motion } from 'framer-motion';

const items = [
  { title: 'quietprism', href: '/quietprism', body: 'quiet prism of shared light. multi-file drop with shared note and accent color. soft spectral bands refract, breathe, and settle in your color, like quiet light splitting through a still prism. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quietprism. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softstream', href: '/softstream', body: 'quiet flowing stream of shared light. a gentle horizontal stream of public shares. drop local files to let them drift into storage and the public_shares table. soft spring motion, glass cards that settle as you scroll, professional Discord embeds on every link. large files warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softgallery', href: '/softgallery', body: 'quiet frames of shared light. an image-focused gallery of public shares with a spring-animated lightbox. drop local images or any files into the gallery. each lands in storage and the public_shares table. polished Discord embeds on every link. large files warned, never refused. spring motion, glass surfaces. prior features preserved.' },
  { title: 'softauroratide', href: '/softauroratide', body: 'quiet aurora tides for what you carry. multi-file drop with shared note and accent color. soft flowing bands of aurora light that gently ebb, swell, and breathe in your color, like quiet northern lights washing over a still tide. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softauroratide. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quietnest', href: '/quietnest', body: 'quiet nested rings of light for what you carry. multi-file drop with shared note and accent color. soft concentric rings that gently pulse and breathe in your color, like a quiet nest holding what you set down. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quietnest. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softemberlight', href: '/softemberlight', body: 'soft rising embers of light for what you carry. multi-file drop with shared note and accent color. soft points of warm light that gently rise, fade, and breathe in your color, like quiet embers drifting upward from a still hearth. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softemberlight. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'quiethorizon', href: '/quiethorizon', body: 'quiet horizon of soft settling light for what you carry. multi-file drop with shared note and accent color. soft horizontal bands of light that gently breathe, stretch, and settle in your color, like a still horizon at twilight. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /quiethorizon. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softarchive', href: '/softarchive', body: 'a quiet archive of what has been shared. search the public record or drop local files into the archive. soft layered bands of light that gently drift and settle in your color, like quiet shelves of a still library. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softarchive. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softdawn', href: '/softdawn', body: 'quiet rising dawn light for what you carry. multi-file drop with shared note and accent color. soft expanding bands of warm light that gently lift, breathe, and settle in your color, like the first quiet glow of dawn rising over still water. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softdawn. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softpool', href: '/softpool', body: 'quiet still pool for what you carry. multi-file drop with shared note and accent color. soft concentric pools of light that gently expand and settle in your color, like quiet reflections on a still pool at twilight. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softpool. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softmist', href: '/softmist', body: 'quiet drifting mist for what you carry. multi-file drop with shared note and accent color. translucent veils of light that gently swirl, breathe, and settle in your color, like quiet mist rolling over still water at dawn. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softmist. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'softcandle', href: '/softcandle', body: 'quiet rising candle flames for what you carry. multi-file drop with shared note and accent color. warm points of light that gently rise, pulse, and breathe in your color, like quiet candles settling in still air. spring motion, glass surfaces. each file lands in storage and the public_shares table. discord unfurls /softcandle. large drops warned, never refused. prior features preserved. no traces of boosting.' },
  { title: 'chronicle', href: '/chronicle', body: 'a quiet public record of what has been shared. browse recent public shares from every desk in a clean glass grid, or drop local files directly into the chronicle. each landing creates a polished Discord embed. large files warned, never refused. spring motion, glass surfaces. prior features preserved. no traces of boosting.' },
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
