import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/DocsShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "$AGENT Docs",
  description: "APoW protocol documentation, self-hosted from the GitHub docs source.",
};

export default function DocsIndexPage() {
  return <DocsShell />;
}
