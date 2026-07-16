const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#approach", label: "Approach" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-primary py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <p className="font-display text-xl text-white">Alchemica</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">
            Chemistry and materials advisory for bio-based, polymeric and
            industrial material systems.
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/35">
          © {new Date().getFullYear()} Alchemica. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
