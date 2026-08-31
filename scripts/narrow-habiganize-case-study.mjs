import fs from "node:fs";
import path from "node:path";

const root = "H:/My Portfolio_W2026/Lennaipdate";
const assetsSrc =
  "C:/Users/Admin/.cursor/projects/h-My-Portfolio-W2026-Lennaipdate/assets";
const dest = path.join(root, "public/case-studies/habiganize");

const copies = [
  ["habiganize-ia-diagram.png", "ia-diagram.png"],
  ["habiganize-tokens-board.png", "tokens-diagram.png"],
  ["habiganize-pets-strip.png", "pets-strip.png"],
];
for (const [from, to] of copies) {
  const src = path.join(assetsSrc, from);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dest, to));
    console.log("copied", to);
  } else {
    console.warn("missing", from);
  }
}

const projectsPath = path.join(root, "src/data/projects.json");
const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
const idx = projects.findIndex((p) => p.slug === "habiganize");

const entry = {
  id: projects[idx]?.id || "8",
  slug: "habiganize",
  title: "Habiganize - Habits That Stick (With Pups)",
  subtitle:
    "A cross-platform habit tracker that turns daily check-ins into a pet-care economy - from retention research and Figma into a shipped web, mobile, and extension product.",
  type: "Product Designer, UX & Product Owner (solo)",
  users: "People who start habit apps and quit within a week",
  methods:
    "Retention research synthesis, behavioral design, Figma system, IA and flows, cross-platform UX",
  period: "Jan 2026 - Present",
  tags: [
    "Product Design",
    "UX Design",
    "Gamification",
    "Figma to Code",
    "Cross-Platform",
  ],
  description:
    "Habiganize rethinks habit retention through attachment instead of streak guilt. I owned research synthesis, Figma system design, the habits-to-pets loop, and delivery across web, mobile, and a browser extension.",
  bullets: [
    "Framed retention as an attachment problem (loss aversion + collection), not streak pressure alone.",
    "Designed the habits to pets loop in Figma and shipped it across four surfaces.",
    "Documented key tradeoffs: auth-gated first run vs anonymous-first research; streak freezes still backlog.",
  ],
  challenge:
    "Habit apps lose users fast. Checkbox rewards and brittle streaks create little lasting attachment - quitting feels costless.",
  solution:
    "Pair low-friction daily check-ins with a pet-care economy so consistency feels like nurturing something, not punishing yourself.",
  impact:
    "Live multi-platform product at habitganizer.tech with a coherent neo-brutalist system and pet economy. Measurement and store release are next.",
  coverImage: "/case-studies/habiganize/web-cover.png",
  year: "2026",
  featured: true,
  sections: [
    {
      id: "problem",
      type: "text",
      title: "The Problem",
      summary: "Habit apps fail when quitting has no visible cost",
      body: "People download trackers with good intentions, check a few boxes, then disappear. Industry Health and Fitness retention is harsh - roughly D1 ~25%, D7 ~7%, D30 ~3%. I framed the opportunity as attachment over streak guilt.",
      bullets: [
        "Desk research: Atomic Habits, BJ Fogg, Duolingo and Habitica patterns",
        "Principles: immediate payoff, loss aversion, collection drive, ship the loop first",
        "Role: solo Product Designer, UX, and Product Owner end-to-end",
      ],
    },
    {
      id: "retention-img",
      type: "image",
      src: "/case-studies/habiganize/retention-chart.png",
      caption: "Industry retention cliff that framed the design opportunity",
    },
    {
      id: "solution",
      type: "text",
      title: "Solution & System",
      summary: "Habits fund pets; pets create tomorrow's reason to return",
      body: "Core loop: Today check-in, earn coins food and water, shop and care, meters decay, return. Same account across web, mobile, and Chrome extension.",
      bullets: [
        "Rewards: +10 coins, +1 food, +1 water per completion",
        "About 24 pets, daily decay, care actions, visitors, friends and ranks",
        "Tradeoff: Clerk auth for sync and billing instead of anonymous-first onboarding",
      ],
    },
    {
      id: "loop-img",
      type: "image",
      src: "/case-studies/habiganize/loop-diagram.png",
      caption: "Core product loop diagram",
    },
    {
      id: "ia-img",
      type: "image",
      src: "/case-studies/habiganize/ia-diagram.png",
      caption: "Information architecture across web, mobile, and extension",
    },
    {
      id: "pets-img",
      type: "image",
      src: "/case-studies/habiganize/pets-strip.png",
      caption: "Collectible companions - emotional payoff of the care loop",
    },
    {
      id: "design-img",
      type: "image",
      src: "/case-studies/habiganize/tokens-diagram.png",
      caption: "Neo-brutalist design tokens from Figma to production",
    },
    {
      id: "outcomes",
      type: "text",
      title: "Outcomes & Next Steps",
      summary: "Shipped execution; measurement next",
      body: "Live multi-platform product with a coherent visual system and pet-care economy. Collectible companions make consistency feel like care, not self-surveillance.",
      bullets: [
        "Live at habitganizer.tech - four surfaces, one API",
        "IA: habits to wallet to pets to social across web, mobile, and extension",
        "Not yet: store listing, proven D30 lift, formal usability study",
        "Next: usability tests, retention instrumentation, streak freezes, token parity",
      ],
    },
  ],
};

if (idx >= 0) projects[idx] = entry;
else projects.push(entry);

fs.writeFileSync(projectsPath, `${JSON.stringify(projects, null, 2)}\n`);
console.log("sections=", entry.sections.length);
for (const s of entry.sections) {
  console.log("-", s.type, ":", s.title || s.caption);
}
