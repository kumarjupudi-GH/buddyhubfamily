import { createFileRoute } from "@tanstack/react-router";
import { VisitorAccount } from "@/components/visitor-account";

export const Route = createFileRoute("/usage")({
  head: () => ({
    meta: [
      { title: "AI usage this month — Family BuddyApps" },
      { name: "description", content: "How many answers the buddies gave this month, by AI helper, with an 80% budget alert." },
      { property: "og:title", content: "AI usage this month — Family BuddyApps" },
      { property: "og:description", content: "Monthly buddy answers by AI helper with an 80% budget alert." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisitorAccount,
  errorComponent: ({ error }) => <p className="p-8">{error instanceof Error ? error.message : "Something went wrong."}</p>,
});
