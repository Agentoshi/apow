import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdjacentDocs, getDocNav, getDocPage } from "@/lib/docs";

type DocsShellProps = {
  slug?: string[];
};

function isActive(current: string[], target: string[]) {
  return current.join("/") === target.join("/");
}

export function DocsShell({ slug = [] }: DocsShellProps) {
  const page = getDocPage(slug);
  if (!page) notFound();

  const nav = getDocNav();
  const adjacent = getAdjacentDocs(page.source);

  return (
    <div className="docs-root">
      <header className="docs-topbar">
        <Link className="docs-brand" href="/">
          <img src="/logo.png?v=2" alt="APoW" />
          <span>$AGENT Docs</span>
        </Link>
        <div className="docs-search" aria-label="Search placeholder">
          <span>Search docs</span>
          <kbd>Cmd K</kbd>
        </div>
        <nav className="docs-toplinks" aria-label="Top navigation">
          <Link href="/">Website</Link>
          <a href="https://github.com/Agentoshi/apow/tree/main/packages/core/docs" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          <div className="docs-sidebar-inner">
            {nav.map((group) => (
              <section className="docs-nav-group" key={group.title}>
                <h2>{group.title}</h2>
                {group.items.map((item) => (
                  <Link
                    className={isActive(page.slug, item.slug) ? "active" : undefined}
                    href={item.href}
                    key={item.source}
                  >
                    {item.title}
                  </Link>
                ))}
              </section>
            ))}
          </div>
        </aside>

        <main className="docs-main">
          <div className="docs-breadcrumb">
            <Link href="/docs">Docs</Link>
            {page.slug.length > 0 ? (
              <>
                <span>/</span>
                <span>{page.title}</span>
              </>
            ) : null}
          </div>

          <article className="docs-article">{page.content}</article>

          <nav className="docs-pager" aria-label="Adjacent pages">
            {adjacent.previous ? (
              <Link href={adjacent.previous.href}>
                <span>Previous</span>
                {adjacent.previous.title}
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next ? (
              <Link href={adjacent.next.href}>
                <span>Next</span>
                {adjacent.next.title}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </main>

        <aside className="docs-outline" aria-label="Page outline">
          <div className="docs-outline-inner">
            <h2>On this page</h2>
            {page.headings.length > 0 ? (
              page.headings.map((heading) => (
                <a className={`level-${heading.level}`} href={`#${heading.id}`} key={heading.id}>
                  {heading.title}
                </a>
              ))
            ) : (
              <p>No sections</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
