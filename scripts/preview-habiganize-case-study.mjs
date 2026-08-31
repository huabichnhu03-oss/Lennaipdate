import fs from "node:fs";

const path = new URL("../src/data/projects.json", import.meta.url);
const projects = JSON.parse(fs.readFileSync(path, "utf8"));
const idx = projects.findIndex((p) => p.slug === "habiganize" || p.slug === "habitpup");

const entry = {
  id: projects[idx]?.id || "8",
  slug: "habiganize",
  title: "Habiganize - Habits That Stick (With Pups)",
  subtitle:
    "End-to-end product design for a cross-platform habit tracker that turns daily check-ins into a pet-care economy - designed against retention research, prototyped in Figma, and shipped on web, mobile, and a browser extension.",
  type: "Product Designer, UX Designer & Product Owner (solo)",
  users: "People who start habit apps and abandon them within a week",
  methods:
    "Desk research & competitive synthesis, behavioral design, Figma system design, IA & flows, cross-platform UX, monetization model, full-stack delivery",
  period: "Jan 2026 - Present",
  tags: [
    "Product Design",
    "UX Design",
    "Product Strategy",
    "Gamification",
    "Figma to Code",
    "Cross-Platform",
  ],
  description:
    "Habiganize rethinks habit retention through attachment instead of guilt. Completing habits earns coins, food, and water that fund a virtual pet shop and daily care loop. I owned the problem framing, research synthesis, Figma system, core loop, IA, journeys, monetization model, and shipped implementation across web, Expo mobile, Express/Postgres API, and a Chrome extension.",
  bullets: [
    "Framed retention as an attachment problem (loss aversion + collection) rather than a streak-pressure problem.",
    "Designed the habits → wallet → pets → social loop in Figma and implemented it as one OpenAPI-backed product across four surfaces.",
    "Documented tradeoffs explicitly: Clerk-required auth vs research's anonymous-first recommendation; chain streaks without freezes still on the backlog.",
  ],
  challenge:
    "Habit and Health & Fitness apps lose most users fast (desk research cited ~D1 20-27%, D7 ~7%, D30 ~3%). Checkbox rewards and brittle streaks create little lasting attachment - quitting feels costless, and a broken streak often triggers total abandonment.",
  solution:
    "Design a pet-care economy on top of low-friction daily check-ins: habits fund coins/food/water; pets decay without care; collection and playdate visitors create soft re-engagement. Ship one account across web, mobile, and extension so the loop follows the user.",
  impact:
    "Shipped a live multi-platform product (habitganizer.tech) with a coherent neo-brutalist system, 24 companion pets, social ranks, health tracking scaffolding, and freemium monetization. Measurement and store release remain next-iteration work - outcomes below are execution outcomes, not retention proof.",
  coverImage: "/case-studies/habiganize/web-cover.png",
  year: "2026",
  featured: true,
  sections: [
    {
      id: "overview",
      type: "text",
      title: "Overview",
      summary: "Retention through care, not shame - designed and shipped end-to-end",
      body: "Habiganize is a neo-brutalist habit companion where small daily ticks fund virtual pets. The product thesis: quitting should have a visible emotional cost that feels like nurturing, not self-surveillance. Live web demo at habitganizer.tech; mobile and Chrome extension share the same API and account.",
      bullets: [
        "Role: solo Product Designer / UX / Product Owner + full-stack build",
        "Platforms: Web (React/Vite), iOS/Android (Expo), Chrome MV3 extension, Express + Neon Postgres",
        "Stage: working web product; App Store / Play Store public release still in progress",
      ],
    },
    {
      id: "cover-img",
      type: "image",
      src: "/case-studies/habiganize/web-cover.png",
      caption: "Shipped web entry - Habiganize brand, CTA, and neo-brutalist framing",
    },
    {
      id: "role",
      type: "text",
      title: "My Role",
      summary: "One owner across product vision, UX, and delivery",
      body: "As a solo builder I wore PD, UX, and PO hats deliberately - so the case study separates those lenses.",
      bullets: [
        "Product Design: vision, pet-economy system, neo-brutalist visual language, auth theming, screen set (Today, habits, pups/shop, friends/ranks, premium, health)",
        "UX: research synthesis (Atomic Habits, BJ Fogg, Duolingo/Habitica patterns), journey maps, friction tradeoffs, cross-platform IA",
        "Product Owner: MVP sequencing (loop first), freemium model, platform strategy (one API / many clients), backlog vs research debt (streak freezes, anonymous-first)",
      ],
    },
    {
      id: "problem",
      type: "text",
      title: "The Problem",
      summary: "Habit apps fail when quitting has no visible cost",
      body: "People download trackers with good intentions, check a few boxes, then disappear. Industry retention for Health & Fitness is harsh; the reward loop is often too abstract. A checked box gives a brief dopamine hit. A broken streak often causes users to quit entirely.",
      bullets: [
        "Abstract rewards fade after the novelty week",
        "Streak-only motivation creates anxiety and abandonment after breaks",
        "Existing apps rarely make coming back feel emotionally worth it",
      ],
    },
    {
      id: "opportunity",
      type: "problem-solution",
      problem:
        "Checkbox and streak-only products treat consistency as self-discipline theater. When motivation dips, there is nothing personal left to protect.",
      solution:
        "Make consistency feel like caring for something. Loss aversion (I don't want my pet to decline), collection drive (I want more companions), and daily care timers create a reason to return that outlasts willpower.",
    },
    {
      id: "research",
      type: "text",
      title: "Research & Insights",
      summary: "Desk research and competitive synthesis shaped the loop - not formal user interviews yet",
      body: "Discovery centered on a written architecture/retention report (May 2026) plus pattern review of Habitica-style gamification, Duolingo streak psychology, Atomic Habits, and BJ Fogg's B = M x A x P. I am transparent that this project does not yet include moderated usability studies or instrumented cohort metrics.",
      bullets: [
        "Insight: motivation fades; systems and low friction stick - one-tap Today list",
        "Insight: immediate feedback matters - coins/food/water on every completion",
        "Insight: loss aversion beats abstract gains - a declining pet is more salient than a missed checkbox",
        "Insight: collection and visitors create soft re-engagement without pure guilt",
        "Insight: streaks alone are brittle - research ranked streak freezes highly; not shipped yet (documented tradeoff)",
        "Not done yet: formal interviews, named research personas, analytics proving D30 lift",
      ],
      body2:
        "Working (assumed) user: \"Restart Riley\" - tried 2-3 habit apps, drops off in a week, responds better to playful care than productivity guilt, uses phone + laptop.",
    },
    {
      id: "goals",
      type: "text",
      title: "Goals & Success Criteria",
      summary: "Product and UX goals are defined; measurement is the next iteration",
      bullets: [
        "Product: make completion rewarding in seconds; retention loop stronger than streak guilt; coherent multi-platform system; light social accountability; sustainable monetization without crushing free users",
        "UX: one-tap done, clear habits-fund-pets mental model, high-contrast tappable UI, on-brand auth/onboarding",
        "Intended metrics (not instrumented yet): D30 retention target 8-12% from research, day-1 first-habit completion, pets adopted/user, weekly return after first adoption, premium funnel",
      ],
      body2:
        "Portfolio honesty: shipped outcomes below are design and execution outcomes. Retention proof requires instrumentation and study - listed as next steps, not results.",
    },
    {
      id: "principles",
      type: "text",
      title: "Design Principles",
      summary: "Decision filters used throughout the project",
      bullets: [
        "Attachment over anxiety - motivate with care, not punishment",
        "Immediate payoff - every completion yields visible rewards",
        "One job per screen - Today = check off; Pups = care; Shop = spend",
        "Brand as memory - neo-brutalist look so the product is recognizable",
        "One account, many doors - web / mobile / extension share identity and data",
        "Ship the loop first - economy must work before polishing secondary features",
      ],
    },
    {
      id: "problem-statement",
      type: "text",
      title: "Problem Statement",
      summary: "Jobs-to-be-done style framing",
      body: "For people who want better routines but abandon trackers quickly, Habiganize is a habit companion that converts check-ins into caring for virtual pets - unlike checkbox or streak-only apps - because emotional attachment and daily care needs create a reason to return that outlasts willpower.",
    },
    {
      id: "ia",
      type: "text",
      title: "Information Architecture",
      summary: "Same mental model across surfaces, with known mobile parity gaps",
      body: "Mental model: Habits (behavior) → Wallet (coins, food, water) → Pets (care, level, collection) → Friends / Leaderboards (social proof).",
      bullets: [
        "Web nav: Today, Habits, Stats, History, Health, Pups, Friends, Ranks, Premium",
        "Mobile tabs: Today, Habits, Stats, Health, Pups (History / Friends / Ranks via Settings - parity gap)",
        "Extension: API config + quick habit check-off only (desk micro-habit)",
      ],
    },
    {
      id: "loop",
      type: "text",
      title: "Core Product Loop",
      summary: "Habits fund pets; pets create tomorrow's reason to return",
      body: "1) Open Today → 2) Complete habit (optional mood/note) → 3) Earn 10 coins + 1 food + 1 water → 4) Visit Pups/Shop → 5) Buy pet (50-320 coins) or supplies → 6) Care (feed/water/walk/bath/play/train) → 7) Meters decay daily → 8) Optional playdate visitor, friends, ranks, rewarded ads.",
      bullets: [
        "Earning and spending are separated so habits stay the engine of the economy",
        "Decay creates urgency without relying only on toxic streak panic",
        "Collection + visitor system adds soft FOMO without pay-to-win on the core loop",
      ],
    },
    {
      id: "economy",
      type: "text",
      title: "System Design - Economy Rules",
      summary: "Specific enough for PD/PO interviews",
      bullets: [
        "Completion reward: +10 coins, +1 food, +1 water",
        "Catalog: ~24 companions (dogs, cats, otter, beaver, etc.), priced ~50-320 coins",
        "Decay: hunger/thirst ~10 pts/day; levels 1-10; starvation / well-fed rules ~24h",
        "Train: 5 coins, 30m cooldown, 5 tricks per level",
        "Care: Walk (4h reset / 1h CD), Bath (2d / 12h), Play (3h / 30m)",
        "Foods: Kibble 8c/~25 hunger; Treat 20/~50; Premium 45/~90 + level bump",
        "Playdate visitor ~6h cooldown, +15 coins; rewarded ad can shorten wait; ads +10 coins ~3h CD",
      ],
    },
    {
      id: "pets-img",
      type: "image",
      src: "/case-studies/habiganize/pet-system.png",
      caption: "Pet avatar guidelines - kept the collectible shop visually coherent",
    },
    {
      id: "journeys",
      type: "text",
      title: "Key User Journeys",
      summary: "First run, daily return, care session, social, monetization",
      bullets: [
        "First-time: Welcome → Clerk sign-up → optional tour → optional profile → create/complete first habit → discover Pups with first coins",
        "Daily return: Today → complete due habits → optional mood → brief pet care → leave",
        "Pet care deep session: collection → feed/water → walk/bath/play/train → dress-up/nickname → visitor",
        "Social: share friend code → accept requests → leaderboard (coins or completions; friends or global)",
        "Monetization: hit free limits or want ad-free/exclusives → Free/Pro/Premium/Ultimate, coin packs, or donate (Stripe / Clerk Billing)",
      ],
      body2:
        "Known UX tension: research recommended anonymous-first to cut signup drop-off; product requires Clerk for sync and billing. Tradeoff chosen consciously - higher first-run friction for stronger multi-device identity.",
    },
    {
      id: "visual",
      type: "text",
      title: "Visual System (Figma → UI)",
      summary: "Neo-brutalist tokens designed to survive implementation",
      body: "Direction: thick borders, hard offset shadows, chunky radius, bold type, warm playful palette - memorable against gray/purple productivity defaults. Tokens moved from Figma into CSS variables / Tailwind; Clerk themed to match so auth feels native.",
      bullets: [
        "Web: cream ~#faf6f0, cocoa ink ~#3a2f26, strawberry primary ~#e85d8f, golden accent, Lexend, radius ~1.5rem, shadow-brutal / border-brutal",
        "Mobile (related, not identical): cream #f8f0dc, ink #141414, primary blue #4258d6 - called out as a parity gap to resolve",
        "Pet art system: shared avatar guidelines + production PNGs for the shop collection",
      ],
    },
    {
      id: "shiba-img",
      type: "image",
      src: "/case-studies/habiganize/shiba.png",
      caption: "Collectible companion example (Shiba) - emotional payoff of staying consistent",
    },
    {
      id: "interactions",
      type: "text",
      title: "Interaction Design Details",
      summary: "Micro-patterns that support the loop",
      bullets: [
        "One-tap complete + undo",
        "Mood chips on completion (great / good / okay / meh / bad) + short note",
        "Cooldown-aware care actions (disabled / waiting states)",
        "Empty, free-day, and all-done Today states",
        "Not-enough-coins CTA routes users back to habits (closes the economy in copy)",
        "Cold-start wake screen with fun facts while free-tier API boots",
        "Soft in-app feedback prompt + Settings feedback entry",
      ],
    },
    {
      id: "features",
      type: "text",
      title: "Feature Scope",
      summary: "What shipped beyond the core loop",
      bullets: [
        "Habits: CRUD, colors/icons, weekday schedules, local-date completions, streaks, reminders, history/stats",
        "Pets & economy: wallet, shop, care, train, toys, dress-up, nicknames, playdate visitor",
        "Social: friend codes, requests, leaderboards",
        "Health: steps, calories, sleep, stand-ups, heart rate + goals; Android Health Connect WIP",
        "Monetization: free limits, Pro/Premium/Ultimate seeds, coin packs, donations, rewarded ads",
        "i18n: English + Vietnamese on web; grocery list on Today",
      ],
    },
    {
      id: "platforms",
      type: "text",
      title: "Cross-Platform Strategy",
      summary: "One backend, four doors - accept temporary parity debt",
      bullets: [
        "Web: full product surface and primary design iteration environment",
        "Mobile: daily companion; friends/ranks off the tab bar for now; token drift vs web",
        "Extension: desk micro-habit check-off; legacy HabitFlow naming still to clean up",
        "API: shared OpenAPI → generated clients; wallet isolation via Clerk user id",
        "Hosting tradeoff: free Render sleep → cold starts; mitigated with wake UX",
      ],
    },
    {
      id: "tradeoffs",
      type: "text",
      title: "Decisions & Tradeoffs",
      summary: "Interview-ready product judgment",
      bullets: [
        "Pet economy vs streak-only: chose attachment; cost = care-rule complexity",
        "Clerk-required auth vs anonymous-first research: chose sync/billing identity; cost = signup friction",
        "Chain streaks without freezes: faster MVP; cost = missed research's top retention lever",
        "Neo-brutalist brand vs soft minimal UI: differentiation; cost = less \"enterprise\" aesthetic",
        "In-house friends vs social vendor: ownership; cost = moderation later",
        "Full web first vs mobile-only: faster design loops; cost = mobile parity lag",
        "Ads + Premium + donations: multiple support paths; cost = mixed messaging tension to resolve",
      ],
    },
    {
      id: "validation",
      type: "text",
      title: "Validation & Feedback",
      summary: "What exists today vs what a stronger study needs",
      body: "In-app feedback (rating + message) and a soft prompt exist; events are logged server-side. There is no research database or cohort analytics dashboard yet.",
      bullets: [
        "Next: 5 moderated usability tests on Today + Pets",
        "Next: preference test - streak guilt framing vs pet-care framing",
        "Next: instrument D1/D7 completion, first-pet adoption, next-day return",
        "Next: consider a 7-day diary study on care-loop anxiety vs motivation",
      ],
    },
    {
      id: "outcomes",
      type: "text",
      title: "Outcomes",
      summary: "Execution outcomes shipped; retention proof is next",
      bullets: [
        "End-to-end solo delivery: research synthesis → Figma system → production web + mobile + API + extension",
        "Live product at habitganizer.tech with shared auth and pet economy",
        "Neo-brutalist language applied through Clerk auth surfaces",
        "Social, health, and monetization scaffolding beyond the MVP loop",
        "EN/VI localization on web",
      ],
      body2:
        "Not yet: public App Store/Play listing, proven D30 lift, formal usability results. Learning: retention is a systems problem - polish without a behavioral loop fails, and a loop without measurement cannot prove itself.",
    },
    {
      id: "reflection",
      type: "text",
      title: "Reflection & Next Steps",
      summary: "What worked, what I would change",
      bullets: [
        "Worked: clear north-star loop; strong brand memory; multi-surface shipping forced prioritization",
        "Change: anonymous trial → soft account upgrade",
        "Change: instrument retention before expanding premium tiers",
        "Change: unify web/mobile tokens earlier; usability-test decay anxiety",
        "Change: ship streak freezes before more shop content; resolve Habiganize vs HabitPup naming",
      ],
      body2:
        "Career hooks - PD: systems + craft + shipping. UX: behavioral design and friction tradeoffs. PO: scope, monetization, platform strategy, research debt management.",
    },
  ],
};

if (idx >= 0) projects[idx] = entry;
else projects.push(entry);

fs.writeFileSync(path, `${JSON.stringify(projects, null, 2)}\n`);
console.log(
  `Updated ${entry.slug}: ${entry.sections.length} sections (local seed only - no DB sync)`,
);
