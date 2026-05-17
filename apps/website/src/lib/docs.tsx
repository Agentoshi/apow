import fs from "node:fs";
import path from "node:path";
import React from "react";

export type DocNavItem = {
  title: string;
  source: string;
  href: string;
  slug: string[];
};

export type DocNavGroup = {
  title: string;
  items: DocNavItem[];
};

export type DocHeading = {
  id: string;
  level: number;
  title: string;
};

export type DocPage = {
  source: string;
  slug: string[];
  title: string;
  markdown: string;
  headings: DocHeading[];
  content: React.ReactNode[];
};

const DOCS_ROOT = path.join(process.cwd(), "src/content/docs");
const PUBLIC_EXTRA_SOURCES = ["skill.md"];

function readDocsFile(relativePath: string) {
  return fs.readFileSync(path.join(DOCS_ROOT, relativePath), "utf8");
}

function sourceToSlug(source: string) {
  if (source === "README.md") return [];
  return source.replace(/\.md$/, "").split("/");
}

function sourceToHref(source: string) {
  const slug = sourceToSlug(source);
  return slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;
}

function itemFromSource(title: string, source: string): DocNavItem {
  return {
    title,
    source,
    href: sourceToHref(source),
    slug: sourceToSlug(source),
  };
}

export function getDocNav(): DocNavGroup[] {
  const summary = readDocsFile("SUMMARY.md");
  const groups: DocNavGroup[] = [{ title: "Start Here", items: [] }];
  let currentGroup = groups[0];

  for (const line of summary.split(/\r?\n/)) {
    const groupMatch = line.match(/^##\s+(.+)$/);
    if (groupMatch) {
      currentGroup = { title: groupMatch[1], items: [] };
      groups.push(currentGroup);
      continue;
    }

    const itemMatch = line.match(/\*\s+\[([^\]]+)\]\(([^)]+\.md)\)/);
    if (itemMatch) {
      currentGroup.items.push(itemFromSource(itemMatch[1], itemMatch[2]));
    }
  }

  return groups.filter((group) => group.items.length > 0);
}

function getPublicSources() {
  return new Set([
    ...getDocNav().flatMap((group) => group.items.map((item) => item.source)),
    ...PUBLIC_EXTRA_SOURCES,
  ]);
}

export function getAllDocParams() {
  return [...getPublicSources()]
    .map((source) => sourceToSlug(source))
    .filter((slug) => slug.length > 0)
    .map((slug) => ({ slug }));
}

function sourceFromSlug(slug: string[] = []) {
  return slug.length === 0 ? "README.md" : `${slug.join("/")}.md`;
}

function titleFromMarkdown(markdown: string, fallback: string) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1];
  return title ? stripInline(title) : fallback;
}

function createSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = stripInline(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

export function getDocPage(slug: string[] = []): DocPage | null {
  const source = sourceFromSlug(slug);
  if (!getPublicSources().has(source)) return null;

  const filePath = path.join(DOCS_ROOT, source);
  if (!fs.existsSync(filePath)) return null;

  const markdown = fs.readFileSync(filePath, "utf8");
  const title = titleFromMarkdown(markdown, source);
  const headings = getHeadings(markdown);
  const content = renderMarkdown(markdown, source);

  return { source, slug, title, markdown, headings, content };
}

export function getAdjacentDocs(source: string) {
  const items = getDocNav().flatMap((group) => group.items);
  const index = items.findIndex((item) => item.source === source);
  return {
    previous: index > 0 ? items[index - 1] : null,
    next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
  };
}

function getHeadings(markdown: string): DocHeading[] {
  const slug = createSlugger();
  const headings: DocHeading[] = [];
  let inCode = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      headings.push({
        id: slug(match[2]),
        level: match[1].length,
        title: stripInline(match[2]),
      });
    }
  }

  return headings;
}

function renderMarkdown(markdown: string, source: string) {
  const lines = markdown.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  const slug = createSlugger();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      nodes.push(
        <pre className="docs-code" key={nodes.length}>
          <code data-language={language || undefined}>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.startsWith("<div align=\"center\">")) {
      const html: string[] = [line];
      i += 1;
      while (i < lines.length && !lines[i].includes("</div>")) {
        html.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) html.push(lines[i]);
      i += 1;
      const width = html.join("\n").match(/width="([^"]+)"/)?.[1] ?? "160";
      nodes.push(
        <div className="docs-hero-logo" key={nodes.length}>
          <img src="/logo.png?v=2" alt="APoW" width={width} />
        </div>,
      );
      continue;
    }

    if (line.startsWith("<table data-view=\"cards\">")) {
      const html: string[] = [line];
      i += 1;
      while (i < lines.length && !lines[i].includes("</table>")) {
        html.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) html.push(lines[i]);
      i += 1;
      nodes.push(renderCardsTable(html.join("\n"), source, nodes.length));
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = level > 1 ? slug(text) : undefined;
      nodes.push(renderHeading(level, text, source, id, nodes.length));
      i += 1;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      nodes.push(<hr className="docs-rule" key={nodes.length} />);
      i += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      nodes.push(
        <blockquote className="docs-callout" key={nodes.length}>
          {quote.map((item, index) => (
            <p key={index}>{renderInline(item, source)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (isMarkdownTableStart(lines, i)) {
      const table: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        table.push(lines[i]);
        i += 1;
      }
      nodes.push(renderMarkdownTable(table, source, nodes.length));
      continue;
    }

    if (isListLine(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && isListLine(lines[i]) === true) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      nodes.push(
        <ListTag className="docs-list" key={nodes.length}>
          {items.map((item, index) => (
            <li key={index}>{renderInline(item, source)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines, i)) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    nodes.push(
      <p className="docs-paragraph" key={nodes.length}>
        {renderInline(paragraph.join(" "), source)}
      </p>,
    );
  }

  return nodes;
}

function renderHeading(level: number, text: string, source: string, id: string | undefined, key: number) {
  const children = renderInline(text, source);
  if (level === 1) return <h1 className="docs-heading" key={key}>{children}</h1>;
  if (level === 2) return <h2 id={id} className="docs-heading" key={key}>{children}</h2>;
  if (level === 3) return <h3 id={id} className="docs-heading" key={key}>{children}</h3>;
  return <h4 id={id} className="docs-heading" key={key}>{children}</h4>;
}

function isSpecialLine(lines: string[], index: number) {
  const line = lines[index];
  return (
    line.startsWith("```") ||
    line.startsWith("<div align=\"center\">") ||
    line.startsWith("<table data-view=\"cards\">") ||
    /^#{1,4}\s+/.test(line) ||
    /^-{3,}\s*$/.test(line) ||
    line.startsWith(">") ||
    isMarkdownTableStart(lines, index) ||
    isListLine(line)
  );
}

function isListLine(line: string) {
  return /^\s*(?:[-*]|\d+\.)\s+/.test(line);
}

function isMarkdownTableStart(lines: string[], index: number) {
  return (
    lines[index]?.trim().startsWith("|") &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? "")
  );
}

function renderCardsTable(html: string, source: string, key: number) {
  const rows = [...html.matchAll(/<tr><td><strong>(.*?)<\/strong><\/td><td>(.*?)<\/td><\/tr>/g)];
  return (
    <div className="docs-card-grid" key={key}>
      {rows.map((row, index) => (
        <section className="docs-card" key={index}>
          <h3>{renderInline(stripTags(row[1]), source)}</h3>
          <p>{renderInline(stripTags(row[2]), source)}</p>
        </section>
      ))}
    </div>
  );
}

function renderMarkdownTable(lines: string[], source: string, key: number) {
  const [header, , ...body] = lines;
  const headers = splitTableRow(header);
  const rows = body.map(splitTableRow);

  return (
    <div className="docs-table-wrap" key={key}>
      <table className="docs-table">
        <thead>
          <tr>
            {headers.map((cell, index) => (
              <th key={index}>{renderInline(cell, source)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{renderInline(cell, source)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string, source: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(<code key={nodes.length}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={nodes.length}>{renderInline(token.slice(2, -2), source)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = resolveHref(link[2], source);
        const external = /^https?:\/\//.test(href);
        nodes.push(
          <a href={href} key={nodes.length} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
            {renderInline(link[1], source)}
          </a>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function resolveHref(href: string, source: string) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:")) return href;
  if (href.startsWith("#")) return href;

  const [target, hash] = href.split("#");
  if (!target.endsWith(".md")) return href;

  const currentDir = path.posix.dirname(source);
  const relativeSource = path.posix.normalize(path.posix.join(currentDir === "." ? "" : currentDir, target));
  const hashPart = hash ? `#${hash}` : "";

  if (relativeSource === "README.md") return `/docs${hashPart}`;
  return `/docs/${relativeSource.replace(/\.md$/, "")}${hashPart}`;
}

function stripInline(value: string) {
  return stripTags(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, "");
}
