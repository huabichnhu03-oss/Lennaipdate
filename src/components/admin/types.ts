/** Shared types for the admin panel components. */

export type SectionType = "text" | "image" | "problem-solution";

export type Section = {
  id: string;
  type: SectionType;
  title?: string;
  summary?: string;
  body?: string;
  src?: string;
  caption?: string;
  problem?: string;
  solution?: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  tags: string[];
  description: string;
  bullets?: string[];
  challenge: string;
  solution: string;
  impact: string;
  coverImage: string;
  year: string;
  period?: string;
  featured: boolean;
  archived?: boolean;
  sections: Section[];
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type About = {
  bio: string[];
  skills: SkillGroup[];
};

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  bullets: string[];
};

export type EducationItem = {
  id: string;
  degree: string;
  institution: string;
  year: string;
};

export type GalleryItem = {
  id: string;
  kind?: "big" | "small";
  slug: string;
  title: string;
  role: string;
  year?: string;
  description?: string;
  tags?: string[];
  coverImage: string;
  images?: string[];
  order?: number;
  linkUrl?: string;
  linkLabel?: string;
};

export type Identity = {
  name: string;
  role: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Contact = {
  email: string;
  phone: string;
  location: string;
  socials: SocialLink[];
};

export type ResumeMeta = {
  url: string;
  filename: string;
  updatedAt: string;
};

export type Files = {
  resume: ResumeMeta;
};

export type EntryCard = {
  number: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
};

export type Homepage = {
  entry: {
    wordmarkPrefix: string;
    wordmarkSuffix: string;
    topbarTagline: string;
    designCard: EntryCard;
    artCard: EntryCard;
    bottomPrompt: string;
  };
  home: {
    heroEyebrow: string;
    heroIntro: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    selectedWorkHeading: string;
    selectedWorkLinkLabel: string;
    aboutEyebrow: string;
    aboutHeading: string;
    aboutCtaLabel: string;
  };
};

export type ContentData = {
  projects: Project[];
  about: About;
  experience: ExperienceItem[];
  education: EducationItem[];
  gallery: GalleryItem[];
  identity: Identity;
  contact: Contact;
  files: Files;
  homepage: Homepage;
};

export type Asset = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type AssetType = "all" | "image" | "gif" | "video";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type PreflightInfo = {
  sectionSizes: { name: string; bytes: number; formatted: string }[];
  totalBytes: number;
  totalFormatted: string;
  oversizeSections: string[];
  largestSection: string;
  inlineMedia: { section: string; itemLabel: string; field: string }[];
  storageBackend: string;
  allClear: boolean;
};

export type PickerOpts = { type?: AssetType };
export type AssetPickerFn = (
  onPick: (url: string) => void,
  opts?: PickerOpts,
) => void;
export type AssetUploadFn = (file: File) => Promise<string>;
