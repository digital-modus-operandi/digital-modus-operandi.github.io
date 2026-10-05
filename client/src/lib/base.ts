/**
 * Базовый путь сайта.
 *
 * На корне домена (свой домен или <user>.github.io) это пустая строка.
 * На GitHub Pages проекта (<user>.github.io/<repo>) это "/<repo>".
 * Значение задаётся при сборке через Vite `base` (см. vite.config.ts).
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Дописывает базовый путь к абсолютному пути сайта: "/team/a.webp" -> "<base>/team/a.webp". */
export function withBase(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
