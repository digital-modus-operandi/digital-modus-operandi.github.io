import { useEffect } from "react";

export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  "https://digital-modus-operandi.vercel.app"
).replace(/\/$/, "");

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.png`;

type SeoOptions = {
  title: string;
  description: string;
  /** Path with a leading slash, used for the canonical URL. */
  path: string;
  image?: string;
  type?: "website" | "article";
  /** Set for pages that must stay out of the index (unconfirmed cases). */
  noindex?: boolean;
  /** JSON-LD graph. Only ever built from facts we can stand behind. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) =>
    element!.setAttribute(key, value)
  );
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`
  );
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function useSeo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    document.title = title;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow",
    });
    upsertLink("canonical", url);

    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Digital Modus Operandi",
    });
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "ru_RU",
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });

    const scriptId = "dmo-json-ld";
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, path, image, type, noindex, jsonLd]);
}

/**
 * Structured data for the organisation.
 * Only facts we can back up: name, description, channels, service categories.
 * No ratings, no employee counts, no invented addresses.
 */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Digital Modus Operandi",
  alternateName: "DMO",
  url: SITE_URL,
  description:
    "Разработка B2B-сайтов, каталогов, личных кабинетов и внутренних CRM-систем с интеграцией в CRM, ERP и складской учёт.",
  email: "Digital-Modus-Operandi.2026@yandex.ru",
  sameAs: ["https://t.me/Arseniy_Karpenko"],
  knowsAbout: [
    "B2B-сайты и каталоги",
    "Личные кабинеты для клиентов",
    "CRM и внутренние системы",
    "Интеграции и автоматизация",
  ],
};
