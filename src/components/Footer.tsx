export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8 px-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-semibold tracking-tight text-neutral-600">
          rank<span className="text-[#0a84ff]/70">vault</span>
        </span>
        <span className="text-xs text-neutral-700">
          &copy; {new Date().getFullYear()} rankvault
        </span>
      </div>
    </footer>
  );
}
