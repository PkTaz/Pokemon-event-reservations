import Link from "next/link";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 py-8 ${className}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  light?: boolean;
}

export function PageHeader({ title, subtitle, light = false }: PageHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <h1
        className={`poke-title text-3xl font-black tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-poke-navy"
        }`}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={`mt-2 text-base font-semibold ${
            light ? "text-blue-100" : "text-poke-blue-dark"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const styles =
    variant === "primary" ? "poke-btn" : "poke-btn-secondary";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center px-6 py-3 text-sm ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-bold text-white/90 hover:text-poke-yellow transition"
    >
      ← {label}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`poke-panel p-5 ${className}`}>{children}</div>
  );
}

export function AccentBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border-2 border-poke-navy bg-poke-red px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_2px_0_var(--poke-navy)]">
      {children}
    </span>
  );
}

export function InfoBox({
  children,
  variant = "default",
  title,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "rare" | "success";
  title?: string;
  className?: string;
}) {
  const variants = {
    default: "border-poke-yellow-dark bg-poke-cream",
    rare: "border-purple-600 bg-gradient-to-br from-purple-100 to-indigo-100",
    success: "border-green-600 bg-green-50",
  };

  return (
    <div className={`poke-panel-inset p-5 text-sm ${variants[variant]} ${className}`}>
      {title ? (
        <p className="mb-2 font-black uppercase tracking-wide text-poke-navy">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function PokeballIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#ee1515" stroke="#1a1a2e" strokeWidth="3" />
      <path d="M2 24 H46" stroke="#1a1a2e" strokeWidth="3" />
      <path d="M2 24 A22 22 0 0 1 46 24" fill="white" />
      <circle cx="24" cy="24" r="7" fill="white" stroke="#1a1a2e" strokeWidth="3" />
      <circle cx="24" cy="24" r="3" fill="#1a1a2e" />
    </svg>
  );
}
