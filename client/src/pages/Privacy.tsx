import { useEffect } from "react";
import { Shield, ArrowUpRight } from "lucide-react";
import SiteShell from "@/components/site/SiteShell";
import { captureAttribution } from "@/lib/leads";
import { useSeo } from "@/lib/seo";
import { privacyPolicyContent, companyRequisites } from "@/content/legal";
import { primaryCta } from "@/content/site";

export default function Privacy() {
  useSeo({
    title: "Политика конфиденциальности — Digital Modus Operandi",
    description:
      "Информация об обработке и защите персональных данных в соответствии с Законом Республики Молдова № 133/2011.",
    path: "/privacy",
  });

  useEffect(() => {
    captureAttribution();
    window.scrollTo(0, 0);
  }, []);

  return (
    <SiteShell>
      <section
        className="legal-page page-top section-pad section-dark"
        aria-labelledby="privacy-page-title"
      >
        <div className="section-heading reveal">
          <span className="section-index">// LEGAL</span>
          <span className="mono">ПЕРСОНАЛЬНЫЕ ДАННЫЕ / LAW 133/2011 RM</span>
          <span className="heading-note">
            обновлено: {privacyPolicyContent.lastUpdated}
          </span>
        </div>

        <div className="legal-header reveal">
          <h1 className="display" id="privacy-page-title">
            Политика
            <br />
            <em>конфиденциальности.</em>
          </h1>
          <p>{privacyPolicyContent.subtitle}</p>
        </div>

        <div className="legal-body reveal">
          {privacyPolicyContent.sections.map((section) => (
            <article key={section.id} id={section.id} className="legal-section">
              <h2>{section.title}</h2>
              {section.text.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          ))}

          <div className="legal-requisites-box">
            <span className="mono">// ОФИЦИАЛЬНЫЕ РЕКВИЗИТЫ ОПЕРАТОРА (РМ)</span>
            <h3>{companyRequisites.legalName}</h3>
            <p><strong>IDNO (Фискальный код):</strong> {companyRequisites.idno}</p>
            <p><strong>Юридический адрес:</strong> {companyRequisites.address}</p>
            <p><strong>Email по вопросам данных:</strong> <a href={`mailto:${companyRequisites.dpoEmail}`}>{companyRequisites.dpoEmail}</a></p>
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
