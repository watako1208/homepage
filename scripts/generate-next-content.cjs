const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));

function normalizeLinks(html) {
  return html
    .replace(/href="index\.html(#.*?)?"/g, (_, hash = "") => `href="/${hash}"`)
    .replace(/href="([a-z0-9-]+)\.html(#.*?)?"/g, (_, slug, hash = "") => `href="/${slug}${hash}"`)
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="assets\//g, 'href="/assets/');
}

function extract(pattern, source, fallback = "") {
  const match = source.match(pattern);
  return match ? (match[1] ?? match[0]).trim() : fallback;
}

const pages = {};

for (const file of htmlFiles) {
  const slug = file === "index.html" ? "index" : file.replace(/\.html$/, "");
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const title = extract(/<title>([\s\S]*?)<\/title>/i, source, "Kick Space Technologies株式会社");
  const description = "";
  const main = extract(/<main\b[^>]*>[\s\S]*?<\/main>/i, source);

  pages[slug] = {
    title,
    description,
    content: normalizeLinks(main)
  };
}

const encodedPages = Buffer.from(JSON.stringify(pages), "utf8").toString("base64");

const out = `export type StaticPage = {
  title: string;
  description: string;
  content: string;
};

export const pages: Record<string, StaticPage> = JSON.parse(
  Buffer.from("${encodedPages}", "base64").toString("utf8")
);
`;

fs.mkdirSync(path.join(root, "lib"), { recursive: true });
fs.writeFileSync(path.join(root, "lib", "pages.ts"), out);
