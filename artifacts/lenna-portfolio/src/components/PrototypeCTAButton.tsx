import { motion } from "framer-motion";
import { BRAND_EASE } from "@/lib/brand";

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function PrototypeCTAButton({ url }: { url: string }) {
  if (!url || !url.trim()) return null;

  return (
    <motion.div
      className="flex flex-col items-start gap-1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: BRAND_EASE }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="View prototype in new tab"
      >
        <span>View Prototype</span>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ExternalLinkIcon />
        </span>
      </a>
      <span className="text-muted-foreground text-[11px] font-sans pl-1">
        Opens in new tab
      </span>
    </motion.div>
  );
}
