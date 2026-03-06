export interface TemplateConfig {
  name: string;
  slug: "standard" | "premium" | "minimal";
  description: string;
  colors: {
    primary: string;     // Main brand color
    accent: string;      // Accent / highlight
    lightBg: string;     // Alternate row background
    headerText: string;  // Table header text color
    coverBg: string;     // Cover page background
    coverText: string;   // Cover page text color
  };
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  standard: {
    name: "Standard",
    slug: "standard",
    description: "Banyan green with warm terracotta accents",
    colors: {
      primary: "395542",
      accent: "CF987E",
      lightBg: "f3f4f6",
      headerText: "ffffff",
      coverBg: "395542",
      coverText: "ffffff",
    },
  },
  premium: {
    name: "Premium",
    slug: "premium",
    description: "Dark navy with gold accents",
    colors: {
      primary: "1a1a2e",
      accent: "c4a265",
      lightBg: "f5f3ef",
      headerText: "ffffff",
      coverBg: "1a1a2e",
      coverText: "ffffff",
    },
  },
  minimal: {
    name: "Minimal",
    slug: "minimal",
    description: "Clean white with subtle gray borders",
    colors: {
      primary: "374151",
      accent: "9ca3af",
      lightBg: "f9fafb",
      headerText: "ffffff",
      coverBg: "ffffff",
      coverText: "111827",
    },
  },
};

export function getTemplate(slug?: string | null): TemplateConfig {
  if (slug && TEMPLATES[slug]) return TEMPLATES[slug];
  return TEMPLATES.standard;
}
