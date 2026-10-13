// Single list of BuddyApps shown on the puzzle home page. Add a buddy here;
// set href to null to route it to the "coming soon" placeholder page.
export type BuddyApp = {
  slug: string;
  name: string;
  emoji: string;
  blurb: string;
  color: string; // CSS variable name defined in src/styles.css
  href: string | null;
};

export const BUDDY_APPS: BuddyApp[] = [
  { slug: "homework", name: "Homework Buddy", emoji: "📚", blurb: "Learn subjects and practice with simple explanations.", color: "--piece-1", href: "/apps/homework-buddy/index.html" },
  { slug: "art", name: "Art Buddy", emoji: "🎨", blurb: "Drawing, coloring and shading step by step.", color: "--piece-2", href: "/apps/artbuddy/index.html" },
  { slug: "health", name: "Health & Yoga Buddy", emoji: "🧘", blurb: "Wellness tips, gentle yoga and healthy habits.", color: "--piece-3", href: "/apps/zen-zest/index.html" },
  { slug: "budget", name: "Budget Buddy", emoji: "💰", blurb: "Budgets, expenses and savings plans.", color: "--piece-4", href: "/apps/penny-pilot/index.html" },
  { slug: "repair", name: "Appliance Repair Buddy", emoji: "🔧", blurb: "Troubleshoot appliances safely.", color: "--piece-5", href: "/apps/wrench-wonder/index.html" },
  { slug: "travel", name: "Travel Buddy", emoji: "✈️", blurb: "Family trips, itineraries and budgets.", color: "--piece-6", href: "/apps/wanderly/index.html" },
  { slug: "reminder", name: "Reminder Buddy", emoji: "⏰", blurb: "Reminders, routines and important dates.", color: "--piece-7", href: "/apps/nudge-notes/index.html" },
  { slug: "garden", name: "Garden Buddy", emoji: "🌱", blurb: "Plant care, watering and growing veggies.", color: "--piece-8", href: "/apps/sprout-sage/index.html" },
  { slug: "cooking", name: "Cooking Buddy", emoji: "🍳", blurb: "Recipes and meal plans from what you have.", color: "--piece-9", href: "/apps/spoon-spark/index.html" },
  { slug: "cleaning", name: "Home Cleaning Buddy", emoji: "🏠", blurb: "Cleaning schedules and chore charts.", color: "--piece-10", href: "/apps/tidy-nest/index.html" },
];
