import { Fragment, useEffect } from "react";
import SiteShell from "@/components/site/SiteShell";
import Hero from "@/components/site/Hero";
import Problems from "@/components/site/Problems";
import Services from "@/components/site/Services";
import CasesSection from "@/components/site/CasesSection";
import Process from "@/components/site/Process";
import Trust from "@/components/site/Trust";
import Team from "@/components/site/Team";
import Faq from "@/components/site/Faq";
import Contact from "@/components/site/Contact";
import { initScrollDepthTracking } from "@/lib/analytics";
import { captureAttribution } from "@/lib/leads";
import { organizationJsonLd, useSeo } from "@/lib/seo";
import { marqueeWords } from "@/content/site";

const TRACKED_SECTIONS = [
  { id: "problems", name: "problems" },
  { id: "services", name: "services" },
  { id: "cases", name: "cases" },
  { id: "process", name: "process" },
  { id: "team", name: "team" },
  { id: "faq", name: "faq" },
  { id: "contact", name: "contact" },
];

export default function Home() {
  useSeo({
    title:
      "Разработка B2B-сайтов, личных кабинетов и CRM-систем — Digital Modus Operandi",
    description:
      "Разрабатываем B2B-сайты и каталоги, личные кабинеты, CRM и внутренние системы. Интегрируем их с CRM, ERP и складом, чтобы заявки, цены и статусы перестали проходить через менеджера вручную.",
    path: "/",
    jsonLd: organizationJsonLd,
  });

  useEffect(() => {
    captureAttribution();
    return initScrollDepthTracking(TRACKED_SECTIONS);
  }, []);

  return (
    <SiteShell isHome showPreloader>
      <Hero />

      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[...marqueeWords, ...marqueeWords].map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span>{word}</span>
              <svg className="marquee-star" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </Fragment>
          ))}
        </div>
      </div>

      <Problems />
      <Services />
      <CasesSection />
      <Process />
      <Trust />
      <Team />
      <Faq />
      <Contact />
    </SiteShell>
  );
}
