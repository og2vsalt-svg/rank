const DISCORD = 'https://discord.gg/jfDBYWq6Ax';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8 px-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-bold tracking-tight text-neutral-600">
          rank<span className="text-green-500/60">boosts</span>
        </span>
        <span className="text-xs text-neutral-700">
          &copy; {new Date().getFullYear()} rankboosts
        </span>
        <a
          href={DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-600 hover:text-green-400 transition-colors"
        >
          Discord
        </a>
      </div>
    </footer>
  );
}
