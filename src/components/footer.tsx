const LINKS = [
  { href: "#services", label: "How it works" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-primary py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-12 lg:grid-cols-3">
          <div>
            <p className="font-display text-xl text-white">Alchemica</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              Chemistry and materials advisory for bio-based, polymeric and
              industrial material systems.
            </p>
            <a
              href="mailto:hello@alchemica.dk"
              className="mt-3 inline-block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              hello@alchemica.dk
            </a>
          </div>

          <div>
            <p className="text-sm font-medium text-white">
              Sitemap
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:text-right">
            <p className="text-sm font-medium text-white">
              Sign in
            </p>
            <a
              href="/login"
              className="mt-3 inline-block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              Client &amp; admin login
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Alchemica. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/terms"
              className="inline-block py-1.5 text-xs text-white/70 transition-colors hover:text-white"
            >
              Terms of service
            </a>
            <a
              href="/privacy"
              className="inline-block py-1.5 text-xs text-white/70 transition-colors hover:text-white"
            >
              Privacy &amp; data handling
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
