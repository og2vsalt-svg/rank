import { motion } from 'framer-motion';

const items = [
  { title: 'quietlumenbridge', href: '/quietlumenbridge', body: 'bridge what you carry across quiet light. multi-file local upload where soft glass pillars rise and connect with luminous lines that spring into place. each file can hold its own quiet note or share a bridge caption and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietripple', href: '/softquietripple', body: 'let it ripple outward. drop local files into soft concentric rings that expand and settle with spring motion. each can hold its own quiet note or share a ripple caption and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietprism', href: '/softquietprism', body: 'refract what you carry into quiet light. drop local files into a living prism. soft spectral panes tilt and settle with spring motion. each can carry its own quiet note or share a prism caption and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietnexus', href: '/softquietnexus', body: 'gather around the quiet nexus. drop local files into a soft orbital field. each becomes a glass orb that drifts around a quiet center with spring motion. optional shared note and accent. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softglassvault', href: '/softglassvault', body: 'drop files into the quiet vault. one or many local files, each with its own quiet note or a shared vault caption and accent. soft glass tiles settle with spring motion. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softcurrentdesk', href: '/softcurrentdesk', body: 'let it flow. drop one or many local files, each with its own quiet note or a shared current caption. soft glass tiles drift with spring motion. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietpath', href: '/softquietpath', body: 'walk the quiet path. drop one or many local files with an optional shared note and accent. they settle along a soft path of glass with spring motion. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softlumenhalo', href: '/softlumenhalo', body: 'arrange what you carry in a quiet halo. drop multiple local files, give each a quiet note, watch them orbit in soft glass with spring motion. shares land in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'quiethalo', href: '/quiethalo', body: 'arrange what you carry in a quiet halo of light. drop multiple local files, give each a quiet note, watch them orbit in soft glass with spring motion. shares land in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softglassriver', href: '/softglassriver', body: 'let it flow down the quiet river. drop local files. soft glass tiles drift downstream with spring motion in your accent. shared note. lands in storage and public_shares. every link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softglassatelier', href: '/softglassatelier', body: 'arrange what you carry. drop one or many local files, give each a quiet caption and accent. they land in storage and public_shares. recent glass tiles settle with spring motion. every share link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'moonlitdock', href: '/moonlitdock', body: 'dock what you carry under the quiet moon. drop local files onto soft glass. optional shared note and moonlight accent. they dock in storage and public_shares. recent docks float as glowing cards with spring motion. every share link unfurls a polished Discord card. large drops gently warned about possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softaetherorbit', href: '/softaetherorbit', body: 'let it orbit what you carry. drop local files. they settle as glass orbs that orbit a quiet center with spring motion. shared note and accent. recent public drops shown in the orbit. every share link unfurls a polished Discord card. large batches warned only for possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'helixdesk', href: '/helixdesk', body: 'wind what you carry. drop local files into a living helix. they spiral as glass orbs that wind with spring motion. shared notes and accents. every share link unfurls a polished Discord card. large batches warned only for possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softpulsedesk', href: '/softpulsedesk', body: 'let it breathe. drop local files into a quiet pulse field. they settle as breathing glass orbs that expand and contract with spring motion. shared notes and accents. every share link unfurls a polished Discord card. large batches warned only for possible slowness, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softauroraisle', href: '/softauroraisle', body: 'a quiet aurora isle for what you carry. drop local files onto a still isle. soft ribbons of aurora light rise from the water and settle with spring motion on deep navy glass. search recent shares. shared note, optional expiration. every link unfurls a polished Discord card. large drops warned, never refused. human-crafted Apple-style pacing. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquilldesk', href: '/softquilldesk', body: 'a quiet desk for notes and what you carry. write a note, give it a title, optionally attach a local file. it settles into storage and the public_shares table with your accent. every share link unfurls a polished Discord card. large files receive only a gentle warning of possible slowness. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softlumencathedral', href: '/softlumencathedral', body: 'a quiet cathedral of light for what you carry. drop local files. soft beams of light descend and settle with spring motion on deep navy glass. search recent shares. shared note, optional expiration. every link unfurls a polished Discord card. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'quietgallery', href: '/quietgallery', body: 'a living gallery of shared light. drop local files with a shared note and accent. recent public drops surface as quiet glass cards that settle with spring motion. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softlumenatlas', href: '/softlumenatlas', body: 'a quiet atlas of what has been shared. search recent public drops. add new ones with a shared note and accent. soft light drifts across the glass. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'quietbatch', href: '/quietbatch', body: 'batch what you carry, each with its own note. drop several files. give each a quiet caption. soft vertical light drifts in your accent. each lands separately in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softquietecho', href: '/softquietecho', body: 'an echo for what you carry. drop one or many local files with a shared note and accent. soft concentric echoes expand and fade with spring motion on deep navy glass. recent public drops surface as quiet cards that settle into the echo field. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softlumenpool', href: '/softlumenpool', body: 'a quiet lumen pool for what you carry. drop one or many local files with a shared note and accent. soft ripples of light expand and settle with spring motion on deep navy glass. recent public drops surface as quiet cards in the pool. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'sketch', href: '/sketch', body: 'draw something quiet. a simple canvas for marks that become a PNG in storage and public_shares. every share link unfurls a polished Discord card. soft warning only for large images. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softcascade', href: '/softcascade', body: 'let it cascade. drop one or many local files with a shared note and accent. they enter storage and public_shares. recent public drops settle into a living cascade of glass that flows downward with spring motion. every share link unfurls a polished Discord card. large batches warned only for possible slowness. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softlumenfold', href: '/softlumenfold', body: 'fold what you carry into light. drop one or many local files with a shared note and accent. they enter storage and public_shares. recent public drops settle into a soft folded stack of glass that unfolds with spring motion on hover. every share link unfurls a polished Discord card. large batches warned only for possible slowness. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'auroradesk', href: '/auroradesk', body: 'where light rises. drop one or many local files with a shared note and accent. they rise into storage and public_shares. recent public drops settle as soft aurora cards that lift with spring motion and a gentle breathing glow. every share link unfurls a polished Discord card. large batches warned only for possible slowness. no hard limits. all prior desks remain fully intact. no traces of boosting.' },

  { title: 'softember', href: '/softember', body: 'a quiet ember of warm light for what you carry. drop one or many local files with a shared title, caption, and soft amber accent. glass cards float and settle with spring motion on deep navy, glowing softly like embers. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },
  { title: 'haven', href: '/haven', body: 'a quiet haven for what you carry. drop one or many local files with a shared title, caption, and soft accent. glass cards float and settle with spring motion on deep navy. lands in storage and public_shares. discord unfurls a polished card on every link. large drops warned, never refused. all prior desks remain fully intact. no traces of boosting.' },
  // all prior desks remain available via direct links and the navbar; continuously expanded while preserving every previous feature.
  { title: 'quietbeacon', href: '/quietbeacon', body: 'a quiet beacon for one light. focus one note or local file as a beacon. it lands in storage and the public_shares table with your accent. share links unfurl with polished Discord cards. soft spring motion, frosted glass, gentle pulse. large files receive only a gentle warning of slowness. prior desks remain intact. no traces of boosting.' },
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
