export interface BundleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  maxProducts: number;
}

export const BUNDLE_DEFINITIONS: BundleDefinition[] = [
  {
    id: "weekend-cruise",
    name: "Weekend Cruise Kit",
    description: "Everything for a relaxing weekend on the water",
    icon: "\u26f5",
    keywords: ["sunscreen", "cooler", "rope", "fender", "snack", "drink", "towel", "first aid"],
    maxProducts: 6,
  },
  {
    id: "safety-essentials",
    name: "Safety Essentials",
    description: "Must-have safety gear for every voyage",
    icon: "\ud83d\udea8",
    keywords: ["life jacket", "fire extinguisher", "flare", "first aid", "whistle", "light", "safety"],
    maxProducts: 6,
  },
  {
    id: "docking-package",
    name: "Docking Package",
    description: "Dock like a pro every time",
    icon: "\u2693",
    keywords: ["dock line", "fender", "cleat", "boat hook", "bumper", "mooring", "rope"],
    maxProducts: 6,
  },
  {
    id: "engine-care",
    name: "Engine Care",
    description: "Keep your engine running smooth",
    icon: "\ud83d\udd27",
    keywords: ["oil", "filter", "spark plug", "fuel", "engine", "coolant", "impeller", "belt"],
    maxProducts: 6,
  },
  {
    id: "deck-maintenance",
    name: "Deck Maintenance",
    description: "Keep your deck clean and protected",
    icon: "\ud83e\uddf9",
    keywords: ["cleaner", "polish", "wax", "brush", "teak", "soap", "sponge", "protectant"],
    maxProducts: 6,
  },
];
