/**
 * Build-time SEO prerender.
 *
 * The site is a pure client-side SPA: `client/src/lib/seo.ts` (`useSeo`) writes
 * <title>, description, canonical, OG/Twitter tags and JSON-LD into the DOM
 * after React mounts. A crawler that does not execute JS therefore sees the
 * static tags of the home page on every route, so sharing a case link shows the
 * home-page preview.
 *
 * This plugin takes the already built `index.html` and writes one static copy
 * per route with the meta tags substituted by string operations. No browser,
 * no network, no extra dependency — just Node and the project's own content
 * layer, because the build runs on Vercel where none of that is available.
 *
 * The body stays the SPA shell; React fills it in on the client exactly as
 * before. The texts here are kept in sync by hand with `Cases.tsx` and
 * `CaseDetail.tsx` — same title/description/JSON-LD strings.
 */

import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { publishedCases } from "../client/src/content/cases";

type PrerenderRoute = {
  /** Route path with a leading slash, e.g. "/cases". */
  path: string;
  /** Output file relative to the build outDir. */
  file: string;
  title: string;
  description: string;
  ogType: "website" | "article";
  jsonLd?: Record<string, unknown>;
};

/** Escapes a value that ends up inside an HTML attribute or text node. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Serialises JSON-LD for an inline <script>. `<`, `>` and `&` are escaped as
 * unicode so no payload can close the script tag early.
 */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Inserts a tag just before </head>, keeping that line's indentation. */
function appendToHead(html: string, tag: string): string {
  return html.replace(
    /([^\S\n]*)<\/head>/i,
    (_match, indent: string) => `${indent}  ${tag}\n${indent}</head>`
  );
}

/** Replaces the first match, or appends the tag to <head> when absent. */
function replaceOrAppend(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) {
    return html.replace(pattern, () => tag);
  }
  return appendToHead(html, tag);
}

/**
 * Upserts a <meta> tag identified by `name=` or `property=`.
 * `[^>]*` spans newlines, so multi-line tags in the source HTML are matched too.
 */
function upsertMeta(
  html: string,
  attribute: "name" | "property",
  key: string,
  content: string
): string {
  const pattern = new RegExp(
    `<meta\\b[^>]*\\b${attribute}="${escapeRegExp(key)}"[^>]*>`,
    "i"
  );
  return replaceOrAppend(
    html,
    pattern,
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`
  );
}

const JSON_LD_ID = "dmo-json-ld";

function upsertJsonLd(html: string, jsonLd?: Record<string, unknown>): string {
  // Drop any previously injected graph first (keeps the function idempotent).
  const existing = new RegExp(
    `\\s*<script[^>]*\\bid="${JSON_LD_ID}"[^>]*>[\\s\\S]*?</script>`,
    "i"
  );
  let result = html.replace(existing, "");
  if (!jsonLd) return result;

  // Same id as the client hook uses, so `useSeo` replaces this node instead of
  // appending a second graph once React mounts.
  const script = `<script type="application/ld+json" id="${JSON_LD_ID}">${serializeJsonLd(jsonLd)}</script>`;
  return appendToHead(result, script);
}

export function renderRouteHtml(
  baseHtml: string,
  route: PrerenderRoute,
  siteUrl: string
): string {
  const url = `${siteUrl}${route.path}`;
  let html = baseHtml;

  html = replaceOrAppend(
    html,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(route.title)}</title>`
  );
  html = upsertMeta(html, "name", "description", route.description);
  html = upsertMeta(html, "name", "robots", "index, follow");
  html = replaceOrAppend(
    html,
    /<link\b[^>]*\brel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(url)}" />`
  );

  html = upsertMeta(html, "property", "og:title", route.title);
  html = upsertMeta(html, "property", "og:description", route.description);
  html = upsertMeta(html, "property", "og:type", route.ogType);
  html = upsertMeta(html, "property", "og:url", url);

  html = upsertMeta(html, "name", "twitter:title", route.title);
  html = upsertMeta(html, "name", "twitter:description", route.description);

  html = upsertJsonLd(html, route.jsonLd);

  return html;
}

/** Routes to prerender. `/` already carries the right tags in index.html. */
export function buildRoutes(siteUrl: string): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [
    {
      // Mirrors client/src/pages/Cases.tsx
      path: "/cases",
      file: path.join("cases", "index.html"),
      title: "Кейсы: B2B-системы, каталоги и CRM — Digital Modus Operandi",
      description:
        "Проекты DMO: CRM для производственной компании, e-commerce-платформа с самостоятельным управлением каталогом, EdTech-платформа с европейским финансированием и коммерческий AI-продукт.",
      ogType: "website",
    },
    {
      // Mirrors client/src/pages/Privacy.tsx
      path: "/privacy",
      file: path.join("privacy", "index.html"),
      title: "Политика конфиденциальности — Digital Modus Operandi",
      description:
        "Информация об обработке и защите персональных данных в соответствии с Законом Республики Молдова № 133/2011.",
      ogType: "website",
    },
    {
      // Mirrors client/src/pages/Terms.tsx
      path: "/terms",
      file: path.join("terms", "index.html"),
      title: "Условия использования — Digital Modus Operandi",
      description:
        "Правила использования сайта, права на материалы и порядок предоставления информации Digital Modus Operandi.",
      ogType: "website",
    },
  ];

  // Mirrors client/src/pages/CaseDetail.tsx
  for (const item of publishedCases) {
    routes.push({
      path: `/cases/${item.slug}`,
      file: path.join("cases", item.slug, "index.html"),
      title: `${item.client}: ${item.title} — Digital Modus Operandi`,
      description: item.subtitle,
      ogType: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: `${item.client} — ${item.title}`,
        about: item.industry,
        description: item.subtitle,
        url: `${siteUrl}/cases/${item.slug}`,
        creator: {
          "@type": "Organization",
          name: "Digital Modus Operandi",
          url: siteUrl,
        },
        keywords: item.tags.join(", "),
      },
    });
  }

  return routes;
}

export function seoPrerenderPlugin(siteUrl: string): Plugin {
  let outDir = "";
  let isSsrBuild = false;

  return {
    name: "dmo-seo-prerender",
    apply: "build",
    enforce: "post",

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      isSsrBuild = Boolean(config.build.ssr);
    },

    // closeBundle runs after Rollup has written index.html and after Vite has
    // copied publicDir, so the file on disk is final.
    closeBundle() {
      if (isSsrBuild) return;

      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) {
        this.warn(`[dmo-seo-prerender] ${indexPath} not found, skipping`);
        return;
      }

      const baseHtml = fs.readFileSync(indexPath, "utf-8");
      const routes = buildRoutes(siteUrl);

      for (const route of routes) {
        const target = path.join(outDir, route.file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(
          target,
          renderRouteHtml(baseHtml, route, siteUrl),
          "utf-8"
        );
      }

      // eslint-disable-next-line no-console
      console.log(
        `dmo-seo-prerender: ${routes.length} static route(s) written`
      );
    },
  };
}
