import { motion } from "framer-motion";
import { Link } from "wouter";
import projectsSeed from "@/data/projects.json";
import aboutSeed from "@/data/about.json";
import identitySeed from "@/data/identity.json";
import contactSeed from "@/data/contact.json";
import homepageSeed from "@/data/homepage.json";
import { useContent } from "@/lib/use-content";

// Split the editable identity name into a first word (highlighted in
// brand blue) and the remainder, falling back gracefully if the name
// is a single word.
function splitName(full: string): [string, string] {
  const trimmed = (full || "").trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return [trimmed, ""];
  return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
}
import { FloatingDecor } from "@/components/FloatingDecor";
import { PinterestCard } from "@/components/PinterestCard";
import { useTheme } from "@/context/ThemeContext";

const BLUE = "#1F67F1";

function buildStats(location: string) {
  const stats = [
    { label: "3+",  sub: "Years",    color: BLUE },
    { label: "20+", sub: "Projects", color: BLUE },
    { label: "8+",  sub: "Studies",  color: BLUE },
  ];
  const trimmed = (location ?? "").trim();
  if (trimmed) {
    // Use the first comma-separated token (e.g. "Toronto" from "Toronto, ON, Canada")
    const primary = trimmed.split(",")[0].trim();
    stats.push({ label: primary, sub: "Based", color: BLUE });
  }
  return stats;
}

const item = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const VP = { once: true, margin: "-80px" };

export default function Home() {
  const projectsData = useContent("projects", projectsSeed) as typeof projectsSeed;
  const aboutData = useContent("about", aboutSeed) as typeof aboutSeed;
  const identityData = useContent("identity", identitySeed) as typeof identitySeed;
  const contactData = useContent("contact", contactSeed) as typeof contactSeed;
  const homepageData = useContent("homepage", homepageSeed) as typeof homepageSeed;
  const featuredProjects = projectsData.filter((p) => p.featured).slice(0, 3);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [firstName, lastName] = splitName(identityData.name);
  const STATS = buildStats(contactData.location);
  const hp = homepageData.home;

  return (
    <div className="w-full flex flex-col gap-32 md:gap-48 pt-12 md:pt-24 pb-20">

      {/* ── Hero ── */}
      <section className="relative flex flex-col gap-8 md:gap-10">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FloatingDecor opacity={0.4} />
        </div>

        <motion.span
          className="relative z-10 text-sm uppercase tracking-[0.5em] font-sans"
          style={{ color: BLUE }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {hp.heroEyebrow}
        </motion.span>

        {/* LENNA / Hua — simple word reveal */}
        <h1
          className="relative z-10 font-display font-black uppercase leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(4rem,13vw,12rem)" }}
          aria-label={identityData.name}
        >
          <motion.span
            className="block"
            style={{ color: BLUE }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {firstName}
          </motion.span>
          {lastName && (
            <motion.span
              className="block text-foreground"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            >
              {lastName}
            </motion.span>
          )}
        </h1>

        <motion.p
          className="relative z-10 max-w-xl text-muted-foreground text-lg md:text-xl leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
        >
          {hp.heroIntro}
        </motion.p>

        {/* Stat pills */}
        <motion.div
          className="relative z-10 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
        >
          {STATS.map(({ label, sub, color }) => (
            <div
              key={sub}
              className="flex flex-col px-4 py-2.5 rounded-xl"
              style={{ background: color + "1a", border: `1.5px solid ${color}50` }}
            >
              <span className="font-display font-black uppercase text-lg leading-none" style={{ color }}>{label}</span>
              <span className="text-muted-foreground text-sm uppercase tracking-widest font-sans mt-0.5">{sub}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="relative z-10 flex flex-wrap gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Link
            href={hp.primaryCtaHref}
            className="text-sm uppercase tracking-[0.35em] font-sans px-6 py-3 rounded-full font-bold transition-opacity hover:opacity-85"
            style={{ background: BLUE, color: "#FFFFFF" }}
          >
            {hp.primaryCtaLabel}
          </Link>
          <Link
            href={hp.secondaryCtaHref}
            className="text-sm uppercase tracking-[0.35em] font-sans px-6 py-3 rounded-full border-2 transition-all hover:opacity-75"
            style={{ borderColor: BLUE + "55", color: BLUE }}
          >
            {hp.secondaryCtaLabel}
          </Link>
        </motion.div>
      </section>

      {/* ── Featured Projects ── */}
      <section className="flex flex-col gap-12">
        <div className="flex justify-between items-end pb-6" style={{ borderBottom: `2px solid ${BLUE}55` }}>
          <h2
            className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight"
            style={{ color: BLUE }}
          >
            {hp.selectedWorkHeading}
          </h2>
          <Link
            href="/work"
            className="text-sm uppercase tracking-widest font-sans hover:opacity-70 transition-opacity"
            style={{ color: BLUE }}
          >
            {hp.selectedWorkLinkLabel}
          </Link>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={VP}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
        >
          {featuredProjects.map((project) => {
            const i = projectsData.findIndex((p) => p.id === project.id);
            return (
              <motion.div key={project.id} variants={item} className="h-full">
                <Link href={`/work/${project.slug}`} className="block h-full">
                  <PinterestCard project={project} i={i} isDark={isDark} />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Brief About ── */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VP}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 md:p-16 rounded-2xl flex flex-col md:flex-row gap-12 justify-between"
        style={{ background: BLUE + "10", border: `2px solid ${BLUE}35` }}
      >
        <div className="flex flex-col gap-3 shrink-0">
          <span className="text-sm uppercase tracking-[0.45em] font-sans font-bold" style={{ color: BLUE }}>
            {hp.aboutEyebrow}
          </span>
          <h2
            className="font-display font-black uppercase text-4xl md:text-5xl leading-tight"
            style={{ color: BLUE }}
          >
            {hp.aboutHeading}
          </h2>
        </div>
        <div className="max-w-2xl flex flex-col gap-6 text-muted-foreground text-lg leading-relaxed">
          <p>{aboutData.bio[0]}</p>
          <Link
            href="/about"
            className="inline-block w-max pb-1 text-sm uppercase tracking-widest font-sans font-bold transition-opacity hover:opacity-70"
            style={{ color: BLUE, borderBottom: `2px solid ${BLUE}60` }}
          >
            {hp.aboutCtaLabel}
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
