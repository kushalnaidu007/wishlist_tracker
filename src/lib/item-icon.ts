import {
  Armchair,
  Backpack,
  Baby,
  Bed,
  Bike,
  BookOpen,
  Briefcase,
  Camera,
  Car,
  CookingPot,
  Dog,
  Dumbbell,
  Footprints,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  Guitar,
  Headphones,
  Lamp,
  Laptop,
  type LucideIcon,
  Monitor,
  Palette,
  Piano,
  Plane,
  Refrigerator,
  Shirt,
  Smartphone,
  Sofa,
  Speaker,
  Sprout,
  Table2,
  Tablet,
  Tv,
  Utensils,
  Watch,
  WashingMachine,
  Wrench,
} from "lucide-react";

export type CategoryTint = "indigo" | "sage" | "clay" | "gold" | "blue" | "mauve";

interface IconRule {
  keywords: string[];
  icon: LucideIcon;
  tint: CategoryTint;
}

const RULES: IconRule[] = [
  // Electronics
  { keywords: ["tv", "television"], icon: Tv, tint: "indigo" },
  { keywords: ["laptop", "macbook", "notebook computer"], icon: Laptop, tint: "indigo" },
  { keywords: ["phone", "iphone", "smartphone"], icon: Smartphone, tint: "indigo" },
  { keywords: ["tablet", "ipad"], icon: Tablet, tint: "indigo" },
  { keywords: ["headphone", "earbud", "airpod"], icon: Headphones, tint: "indigo" },
  { keywords: ["camera"], icon: Camera, tint: "indigo" },
  { keywords: ["speaker"], icon: Speaker, tint: "indigo" },
  { keywords: ["monitor", "screen"], icon: Monitor, tint: "indigo" },
  { keywords: ["console", "playstation", "xbox", "nintendo", "video game"], icon: Gamepad2, tint: "indigo" },
  { keywords: ["briefcase", "work bag"], icon: Briefcase, tint: "indigo" },

  // Home & furniture
  { keywords: ["sofa", "couch"], icon: Sofa, tint: "sage" },
  { keywords: ["chair", "armchair", "recliner"], icon: Armchair, tint: "sage" },
  { keywords: ["bed", "mattress"], icon: Bed, tint: "sage" },
  { keywords: ["table", "desk"], icon: Table2, tint: "sage" },
  { keywords: ["lamp", "light fixture"], icon: Lamp, tint: "sage" },
  { keywords: ["dishwasher", "washing machine", "washer"], icon: WashingMachine, tint: "sage" },
  { keywords: ["fridge", "refrigerator"], icon: Refrigerator, tint: "sage" },
  { keywords: ["oven", "stove", "cooker"], icon: CookingPot, tint: "sage" },
  { keywords: ["kitchen", "cookware", "utensil"], icon: Utensils, tint: "sage" },
  { keywords: ["plant", "garden"], icon: Sprout, tint: "sage" },
  { keywords: ["tool", "drill", "hammer"], icon: Wrench, tint: "sage" },

  // Fashion & accessories
  { keywords: ["shirt", "jacket", "coat", "clothes", "clothing", "dress"], icon: Shirt, tint: "clay" },
  { keywords: ["shoe", "sneaker", "boot"], icon: Footprints, tint: "clay" },
  { keywords: ["bag", "backpack", "purse"], icon: Backpack, tint: "clay" },
  { keywords: ["watch"], icon: Watch, tint: "clay" },
  { keywords: ["jewelry", "ring", "necklace", "earring"], icon: Gem, tint: "clay" },

  // Leisure & hobby
  { keywords: ["book", "novel"], icon: BookOpen, tint: "gold" },
  { keywords: ["guitar"], icon: Guitar, tint: "gold" },
  { keywords: ["piano", "keyboard instrument"], icon: Piano, tint: "gold" },
  { keywords: ["gym", "dumbbell", "weight", "fitness"], icon: Dumbbell, tint: "gold" },
  { keywords: ["paint", "art supplies", "craft"], icon: Palette, tint: "gold" },
  { keywords: ["course", "class", "tuition", "degree"], icon: GraduationCap, tint: "gold" },

  // Travel
  { keywords: ["flight", "trip", "vacation", "travel", "holiday"], icon: Plane, tint: "blue" },
  { keywords: ["car", "vehicle"], icon: Car, tint: "blue" },
  { keywords: ["bike", "bicycle"], icon: Bike, tint: "blue" },

  // Family
  { keywords: ["baby", "crib", "stroller"], icon: Baby, tint: "mauve" },
  { keywords: ["dog", "cat", "pet"], icon: Dog, tint: "mauve" },
];

const FALLBACK: IconRule = { keywords: [], icon: Gift, tint: "mauve" };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary match with an optional plural suffix — "phone" must not
 * match inside "headphones", but "headphone" must still match "headphones".
 */
function matchesKeyword(name: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}(e?s)?\\b`, "i").test(name);
}

export function getItemVisual(name: string): { icon: LucideIcon; tint: CategoryTint } {
  const match = RULES.find((rule) =>
    rule.keywords.some((k) => matchesKeyword(name, k))
  );
  return match ?? FALLBACK;
}

export const CATEGORY_TINT_CLASSES: Record<CategoryTint, string> = {
  indigo: "bg-cat-indigo text-cat-indigo-foreground",
  sage: "bg-cat-sage text-cat-sage-foreground",
  clay: "bg-cat-clay text-cat-clay-foreground",
  gold: "bg-cat-gold text-cat-gold-foreground",
  blue: "bg-cat-blue text-cat-blue-foreground",
  mauve: "bg-cat-mauve text-cat-mauve-foreground",
};
