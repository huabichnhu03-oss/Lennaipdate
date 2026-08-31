import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const entry = {
  id: "8",
  slug: "habiganize",
  title: "Habiganize - Habits That Stick (With Pups)",
  subtitle:
    "A cross-platform habit tracker where daily check-ins fund a pet-care economy - designed, built, and shipped solo. Live at habitganizer.tech.",
  type: "Product Designer, UX & Product Owner (solo)",
  users: "People who start habit apps and quit within a week",
  methods:
    "Retention research, behavioral design, Figma system, IA & flows, cross-platform UX, product strategy",
  period: "Jan 2026 - Present",
  tags: [
    "Product Design",
    "UX Design",
    "Gamification",
    "Figma to Code",
    "Cross-Platform",
  ],
  description:
    "Habiganize fights habit-app abandonment with emotional attachment instead of streak guilt. I owned the business framing, research, Figma system, and shipped product across web, mobile, and a Chrome extension.",
  bullets: [
    "Reframed retention as attachment: quitting has a visible cost when a pet needs care.",
    "Designed the habits-to-pets loop in Figma and shipped it across four surfaces.",
    "Owned PO decisions: monetization, platform strategy, and documented tradeoffs.",
  ],
  challenge:
    "Habit apps lose most users fast (~25% D1, ~7% D7, ~3% D30). Checkbox rewards fade; broken streaks trigger total drop-off - because leaving costs nothing.",
  solution:
    "Pair one-tap check-ins with a pet economy: habits earn coins, food, and water; companions decay without care. Consistency feels like nurturing, not self-surveillance.",
  impact:
    "Live multi-platform product with a neo-brutalist design system, ~24 companions, and themed auth. Store release and retention metrics are next.",
  coverImage: "/case-studies/habiganize/web-cover.png",
  year: "2026",
  featured: true,
  sections: [
    {
      id: "problem",
      type: "text",
      title: "The Problem",
      summary: "97% of habit app users are gone within a month",
      body:
        "Health & Fitness apps face a brutal retention cliff. Users download with good intentions, check boxes for a few days, then leave - because abstract rewards fade and nothing in the product misses them when they're gone.",
      bullets: [
        "Business lens: retention is the metric that decides if a habit product survives",
        "User lens: \"Restart Riley\" - mid-20s, tried 2-3 apps, quits when streaks break",
        "Root cause: quitting is costless; streak guilt punishes instead of retaining",
      ],
    },
    {
      id: "retention-img",
      type: "image",
      src: "/case-studies/habiganize/retention-chart.png",
      caption: "Industry retention benchmarks that framed the design brief",
      title: "The Retention Cliff",
    },
    {
      id: "bet",
      type: "problem-solution",
      title: "The Bet",
      problem:
        "Checkbox and streak-only apps treat consistency as willpower theater. When motivation dips, there is nothing personal left to protect.",
      solution:
        "Give users something alive to care for. Loss aversion, collection drive, and daily care timers create a reason to return that outlasts guilt.",
    },
    {
      id: "loop",
      type: "text",
      title: "The Care Loop",
      summary: "Habits fund pets; pets bring users back tomorrow",
      body:
        "Today check-in → earn +10 coins, +1 food, +1 water → shop or care for ~24 companions → meters decay → return. One account across web, mobile, and Chrome extension on a shared API.",
      bullets: [
        "Product lens: MVP sequenced loop first; social, health, and premium came after",
        "Design lens: one job per screen - Today, Pups, Shop - so the mental model sticks fast",
        "Tradeoff: Clerk auth for sync and billing vs research's anonymous-first recommendation",
      ],
    },
    {
      id: "loop-img",
      type: "image",
      src: "/case-studies/habiganize/loop-diagram.png",
      caption: "Core product loop - each step maps to a behavioral principle",
      title: "Core Loop",
    },
    {
      id: "design",
      type: "text",
      title: "Design & Platform",
      summary: "Neo-brutalist system from Figma to production, four surfaces",
      body:
        "Thick borders, hard shadows, Lexend type, and a warm cream-and-strawberry palette - built as Figma tokens that map 1:1 to production CSS. Web is full-featured; mobile is the daily companion; the extension is quick-tick only.",
      bullets: [
        "Figma → code: tokens, components, pet art spec for ~24 breeds",
        "Branded auth: Clerk sign-up restyled to match the product",
        "IA: Habits → Wallet → Pets → Social across all surfaces",
      ],
    },
    {
      id: "product-img",
      type: "image",
      src: "/case-studies/habiganize/mobile-screens.png",
      caption:
        "Shipped mobile app (Today + Habits) and live web at habitganizer.tech - try the product in a new tab",
      title: "Shipped Product",
    },
    {
      id: "outcomes",
      type: "text",
      title: "Outcomes",
      summary: "One person across BA, user research, design, and product ownership",
      body:
        "Live product at habitganizer.tech with a working pet economy and coherent design system. I won't invent metrics we haven't instrumented yet - next step is usability testing and D1/D7/D30 measurement.",
      bullets: [
        "BA: framed the problem with market data; retention was the design brief",
        "User: behavioral science - loss aversion, collection, immediate payoff",
        "Design: recognizable token system from Figma through auth screens",
        "Product: freemium model, platform strategy, honest tradeoff documentation",
      ],
    },
  ],
};

for (const rel of ["src/data/projects.json", "lib/data/projects.json"]) {
  const p = path.join(root, rel);
  const projects = JSON.parse(fs.readFileSync(p, "utf8"));
  const idx = projects.findIndex((x) => x.slug === "habiganize");
  if (idx >= 0) projects[idx] = entry;
  else projects.push(entry);
  fs.writeFileSync(p, `${JSON.stringify(projects, null, 2)}\n`);
  console.log(rel, "updated; sections:", entry.sections.length);
}
