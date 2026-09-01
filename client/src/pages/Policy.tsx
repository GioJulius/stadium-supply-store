import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { POLICIES } from "@/lib/policies";
import { WHATSAPP_URL } from "@/lib/storeInfo";
import NotFound from "@/pages/NotFound";

/**
 * One page for returns, privacy and terms. They share a shape — a heading and a
 * run of titled sections — so they share a component; only the copy differs,
 * and that lives in `lib/policies.ts` where it can be reviewed as prose.
 */
export default function Policy({ slug }: { slug: string }) {
  const policy = POLICIES.find(candidate => candidate.slug === slug);
  if (!policy) return <NotFound />;

  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">{policy.eyebrow}</p>
          <h1>{policy.titleTop}<br /><em>{policy.titleEm}</em></h1>
          <p>{policy.intro}</p>
        </section>

        <section className="policy">
          {policy.sections.map(section => (
            <article key={section.heading} className="policy__section">
              <h2>{section.heading}</h2>
              {section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </article>
          ))}
          <a className="size-guide__whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Ask us on WhatsApp <span aria-hidden="true">&#8599;</span>
          </a>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
