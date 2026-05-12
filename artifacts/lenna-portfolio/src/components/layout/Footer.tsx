import type { ReactElement } from "react";
import identitySeed from "@/data/identity.json";
import contactSeed from "@/data/contact.json";
import { useContent } from "@/lib/use-content";

type Identity = typeof identitySeed;
type Contact = typeof contactSeed;

export function Footer() {
  const identity = useContent("identity", identitySeed) as Identity;
  const contact = useContent("contact", contactSeed) as Contact;

  const year = new Date().getFullYear();

  const socials = (contact.socials ?? [])
    .map((s) => ({ label: (s.label ?? "").trim(), href: (s.href ?? "").trim() }))
    .filter((s) => s.label && s.href);

  const phoneHref = contact.phone
    ? `tel:${contact.phone.replace(/[^+\d]/g, "")}`
    : "";

  const linkClass =
    "group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300";
  const underline =
    "relative after:absolute after:left-0 after:bottom-[-2px] after:h-px after:w-full after:scale-x-0 after:origin-left after:bg-current after:transition-transform after:duration-300 group-hover:after:scale-x-100";

  return (
    <footer className="mt-20 md:mt-28 border-t border-border/60">
      <div className="py-12 md:py-14">
        <div className="grid gap-10 md:gap-12 md:grid-cols-12">

          {/* Identity */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl text-foreground leading-none">
              {identity.name}
            </p>
            {identity.role && (
              <p className="text-sm text-muted-foreground tracking-wide">
                {identity.role}
              </p>
            )}
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Crafting digital goods since 2019
            </p>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1">
              Contact
            </p>
            {contact.email?.trim() && (
              <a href={`mailto:${contact.email}`} className={linkClass}>
                <span className={underline}>{contact.email}</span>
              </a>
            )}
            {contact.phone?.trim() && (
              <a href={phoneHref} className={linkClass}>
                <span className={underline}>{contact.phone}</span>
              </a>
            )}
            {contact.location?.trim() && (
              <span className="text-sm text-muted-foreground">
                {contact.location}
              </span>
            )}
          </div>

          {/* Elsewhere */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1">
              Elsewhere
            </p>
            {socials.length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                Coming soon
              </span>
            )}
            {socials.map((s): ReactElement => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <span className={underline}>{s.label}</span>
                <span aria-hidden className="opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300">↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Baseline strip */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} {identity.name}. All rights reserved.</span>
          <span className="tracking-[0.18em] uppercase">
            Designed &amp; built with care
          </span>
        </div>
      </div>
    </footer>
  );
}
