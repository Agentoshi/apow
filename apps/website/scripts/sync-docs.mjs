import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.resolve(
  projectRoot,
  process.env.APOW_DOCS_SOURCE ?? "../apow-core/docs",
);
const targetRoot = path.resolve(projectRoot, "src/content/docs");

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseSummary(summary) {
  const files = new Set(["README.md", "skill.md"]);
  for (const line of summary.split(/\r?\n/)) {
    const match = line.match(/\*\s+\[[^\]]+\]\(([^)]+\.md)\)/);
    if (match) files.add(match[1]);
  }
  return [...files].sort();
}

async function copyFile(relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(targetRoot, relativePath);
  if (!(await pathExists(source))) {
    throw new Error(`Missing docs source file: ${source}`);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

if (!(await pathExists(sourceRoot))) {
  throw new Error(`Docs source directory not found: ${sourceRoot}`);
}

await fs.rm(targetRoot, { recursive: true, force: true });
await fs.mkdir(targetRoot, { recursive: true });

const summary = await fs.readFile(path.join(sourceRoot, "SUMMARY.md"), "utf8");
const files = parseSummary(summary);

await copyFile("SUMMARY.md");
for (const file of files) {
  await copyFile(file);
}

console.log(`Synced ${files.length + 1} docs files from ${sourceRoot}`);
