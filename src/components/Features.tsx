import { motion } from 'framer-motion';

const items = [
  { title: 'softdawn', href: '/softdawn', body: 'quiet rising dawn for files. drop one or many local files with a shared title, caption, and accent light. gentle beams and floating motes that slowly lift, warm, and breathe with spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softstillcove', href: '/softstillcove', body: 'a quiet still cove for what arrives. drop one or many local files with a shared title, caption, and accent light. gentle waves of light breathe and settle with spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softlumenstudio', href: '/softlumenstudio', body: 'a quiet studio for light. drop one or many local files with a shared title, caption, and accent light. soft studio beams gently breathe and settle with spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softlumendusk', href: '/softlumendusk', body: 'files settle under a quiet dusk light. multi-file local drop with shared note and accent. soft fading glows breathe and settle across frosted glass with spring motion. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softlumen', href: '/softlumen', body: 'quiet beams of shared light. multi-file local drop with shared note and accent. soft vertical beams rise and breathe with spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softmeadow', href: '/softmeadow', body: 'files settle like motes in a quiet meadow. multi-file local drop with shared note and accent. floating motes drift with spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softquietharbor', href: '/softquietharbor', body: 'files settle like boats in a quiet harbor. multi-file local drop with shared note and accent. gentle ripples and spring motion on frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softprism', href: '/softprism', body: 'soft prism refraction. multi-file drop with shared note and accent. rotating prisms bend light across frosted glass with spring motion. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a soft warning of possible slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softpulse', href: '/softpulse', body: 'a quiet pulse of light. multi-file drop with shared note and accent. gentle breathing pulse surrounds what you carry. spring motion, frosted glass. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a soft warning of possible slowness. prior desks remain intact.' },
  { title: 'softcascade', href: '/softcascade', body: 'cascading light trails. drop one or many local files with shared title, caption, and accent. each cascades down with spring motion and a gentle light trail. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact.' },
  { title: 'softnimbus', href: '/softnimbus', body: 'soft clouds that gently float and breathe. multi-file local drop with a shared note and accent. each file settles into storage and the public_shares table with spring motion. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
  { title: 'softquay', href: '/softquay', body: 'a quiet quay. drop one or many local files with a shared quay name, caption, and accent light. each settles along the waterline with spring motion and a gentle ripple. files land in storage and the public_shares table. share links unfurl with polished Discord cards. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
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
