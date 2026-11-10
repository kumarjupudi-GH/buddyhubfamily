import { createFileRoute } from "@tanstack/react-router";
import { VisitorAccount } from "@/components/visitor-account";

export const Route = createFileRoute("/usage")({
  head: () => ({
    meta: [
      { title: "Your daily AI usage — Family BuddyApps" },
      { name: "description", content: "Private daily provider usage and estimated costs against your family's budget." },
      { property: "og:title", content: "Your daily AI usage — Family BuddyApps" },
      { property: "og:description", content: "Private daily AI usage with individual 80% budget warnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisitorAccount,
  errorComponent: ({ error }) => <p className="p-8">{error instanceof Error ? error.message : "Something went wrong."}</p>,
});
