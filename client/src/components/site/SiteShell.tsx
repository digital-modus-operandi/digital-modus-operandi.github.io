import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowUpRight, Mail, Menu, Send, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSiteChrome } from "@/hooks/useSiteChrome";
import { track } from "@/lib/analytics";
import { brand, footer, navItems, primaryCta } from "@/content/site";

/** Off-screen but still read by screen readers — no CSS file changes needed. */
const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Every page renders its own SiteShell, so a route change remounts this
 * component and an instance ref cannot tell "first load" from "navigation".
 * Module scope survives that remount.
 */
let lastPath: string | null = null;

type SiteShellProps = {
  children: ReactNode;
  /** Home renders in-page anchors; other routes link back to the home page. */
  isHome?: boolean;
  /** The preloader only plays on the first, full-page entry. */
  showPreloader?: boolean;
};

export default function SiteShell({
  children,
  isHome = false,
  showPreloader = false,
}: SiteShellProps) {
  const [loading, setLoading] = useState(showPreloader);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [location] = useLocation();

  useSiteChrome(cursorRef, cursorDotRef);

  useEffect(() => {
    if (!showPreloader) return;
    const timer = window.setTimeout(() => setLoading(false), 1350);
    return () => window.clearTimeout(timer);
  }, [showPreloader]);

  /**
   * A client-side route change replaces the page without moving focus, so a
   * screen reader stays silent and the keyboard user keeps the old position.
   * Focus the main region and announce the new page title politely.
   */
  useEffect(() => {
    if (lastPath === null || lastPath === location) {
      lastPath = location;
      return;
    }
    lastPath = location;
    setMenuOpen(false);
    mainRef.current?.focus();
    // The page component updates document.title in its own effect, which runs
    // after this one, so read the fresh title on the next frames.
    const timer = window.setTimeout(() => setRouteMessage(document.title), 300);
    return () => window.clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const anchor = (href: string) => (isHome ? href : `/${href}`);

  return (
    <div className="site-shell">
      <div ref={cursorRef} className="cursor-ring" aria-hidden="true">
        <span />
      </div>
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />

      <a className="skip-link" href="#top">
        Перейти к содержимому
      </a>

      {loading && (
        <div className="preloader" aria-hidden="true">
          <div className="preloader-top">
            <span>DMO / SYSTEM ONLINE</span>
            <span>2026</span>
          </div>
          <div className="preloader-center">
            <div className="preloader-mark">
              <span>D</span>
              <span>M</span>
              <span>O</span>
            </div>
            <div className="preloader-progress">
              <span />
            </div>
            <div className="preloader-caption">
              Разбираем процесс <span>— пожалуйста, подождите</span>
            </div>
          </div>
          <div className="preloader-bottom">
            <span>b2b web systems</span>
            <span>000 → 100%</span>
          </div>
        </div>
      )}

      <header className={`site-header ${menuOpen ? "is-open" : ""}`}>
        <Link
          href="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
          aria-label={`${brand.name} — на главную`}
        >
          <span className="brand-symbol">D</span>
          <span className="brand-name">
            digital
            <br />
            <b>modus operandi</b>
          </span>
        </Link>
        <button
          className="menu-trigger magnetic"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          <span>{menuOpen ? "close" : "menu"}</span>
          {menuOpen ? (
            <X size={18} strokeWidth={1.5} />
          ) : (
            <Menu size={18} strokeWidth={1.5} />
          )}
        </button>
      </header>

      {/* The whole overlay is the navigation panel, so the intro and the
          footer inside it stay within a landmark instead of floating loose. */}
      <nav
        id="site-menu"
        className={`menu-overlay ${menuOpen ? "is-visible" : ""}`}
        inert={!menuOpen}
        aria-label="Основная навигация"
      >
        <div className="menu-grid-line" />
        <div className="menu-intro">
          <span className="mono">NAVIGATION / 00</span>
          <p>
            Открываем нужный
            <br />
            контекст.
          </p>
        </div>
        <div className="overlay-nav">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={anchor(item.href)}
              style={{ transitionDelay: `${index * 55 + 80}ms` }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="mono">0{index + 1}</span>
              <span>{item.label}</span>
              <ArrowUpRight size={22} strokeWidth={1.3} />
            </a>
          ))}
        </div>
        <div className="menu-footer">
          <span>{brand.telegramPerson}</span>
          <span>{brand.location}</span>
          <span className="mono">press esc to close</span>
        </div>
      </nav>

      <p role="status" aria-live="polite" style={srOnly}>
        {routeMessage}
      </p>

      {/* tabIndex lets both the skip link and the route change land here. */}
      <main id="top" ref={mainRef} tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>

      <footer className="site-footer section-pad">
        <div className="footer-main">
          <Link href="/" className="brand">
            <span className="brand-symbol">D</span>
            <span className="brand-name">
              digital
              <br />
              <b>modus operandi</b>
            </span>
          </Link>
          <p>
            {footer.line.split("\n").map((line, index) => (
              <span key={line}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <a className="footer-cta" href={anchor("#contact")}>
            {primaryCta} <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brand.name} ({brand.legalName}, IDNO: {brand.idno})</span>
          <div className="footer-legal-links" style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
            <Link href="/privacy" style={{ opacity: 0.8, textDecoration: "underline" }}>Конфиденциальность</Link>
            <Link href="/terms" style={{ opacity: 0.8, textDecoration: "underline" }}>Условия использования</Link>
          </div>
          <div className="socials">
            <a
              href={brand.telegramPersonUrl}
              aria-label={`Написать в Telegram ${brand.telegramPerson}`}
              onClick={() =>
                track("telegram_click", { section: "footer", source: "person" })
              }
            >
              <Send size={16} />
            </a>
            <a
              href={`mailto:${brand.email}`}
              aria-label={`Написать на почту ${brand.email}`}
              onClick={() =>
                track("email_click", { section: "footer", source: "email" })
              }
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
