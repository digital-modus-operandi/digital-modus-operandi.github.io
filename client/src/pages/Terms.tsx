import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import SiteShell from "@/components/site/SiteShell";
import { captureAttribution } from "@/lib/leads";
import { useSeo } from "@/lib/seo";
import { termsOfServiceContent, companyRequisites } from "@/content/legal";
import { primaryCta } from "@/content/site";

export default function Terms() {
  useSeo({
    title: "Условия использования — Digital Modus Operandi",
    description:
      "Правила использования сайта, права на материалы и порядок предоставления информации Digital Modus Operandi.",
    path: "/terms",
  });

  useEffect(() => {
    captureAttribution();
    window.scrollTo(0, 0);
  }, []);

  return (
    <SiteShell>
      <section
        className="legal-page page-top section-pad section-dark"
        aria-labelledby="terms-page-title"
      >
        <div className="section-heading reveal">
          <span className="section-index">// LEGAL</span>
          <span className="mono">УСЛОВИЯ / TERMS OF SERVICE</span>
          <span className="heading-note">
            обновлено: {termsOfServiceContent.lastUpdated}
          </span>
        </div>

        <div className="legal-header reveal">
          <h1 className="display" id="terms-page-title">
            Условия
            <br />
            <em>использования.</em>
          </h1>
          <p>{termsOfServiceContent.subtitle}</p>
        </div>

        <div className="legal-body reveal">
          {termsOfServiceContent.sections.map((section) => (
            <article key={section.id} id={section.id} className="legal-section">
              <h2>{section.title}</h2>
              {section.text.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          ))}

          <div className="legal-requisites-box">
            <span className="mono">// ПРАВООБЛАДАТЕЛЬ И ИСПОЛНИТЕЛЬ</span>
            <h3>{companyRequisites.legalName}</h3>
            <p><strong>IDNO:</strong> {companyRequisites.idno}</p>
            <p><strong>Адрес:</strong> {companyRequisites.address}</p>
            <p><strong>Email:</strong> <a href={`mailto:${companyRequisites.email}`}>{companyRequisites.email}</a></p>
          </div>
        </div>

        <div className="cases-footer reveal" style={{ marginTop: "3rem" }}>
          <a href="/#contact" className="button button-primary magnetic">
            {primaryCta} <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
