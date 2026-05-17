import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/DocsShell";
import { getAllDocParams, getDocPage } from "@/lib/docs";

type DocsPageProps = {
  params: Promise<{ slug: string[] }>;
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllDocParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);

  return {
    title: page ? `${page.title} | $AGENT Docs` : "$AGENT Docs",
    description: page
      ? `APoW documentation: ${page.title}`
      : "APoW protocol documentation, self-hosted from the GitHub docs source.",
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  return <DocsShell slug={slug} />;
}
