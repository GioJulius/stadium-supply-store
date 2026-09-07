import { CartDrawer } from "@/components/CartDrawer";
import { SizeGuideContent } from "@/components/SizeGuide";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { CHART_TOLERANCE, SIZE_CHARTS } from "@/lib/sizeCharts";
import { WHATSAPP_URL } from "@/lib/storeInfo";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

/**
 * The size guide as a page of its own.
 *
 * It already existed twice — as notes inside How it works, and as a dialog on
 * the product page — but never at an address. The returns policy now turns on
 * the customer having checked their size, so there has to be a page to point
 * at, one that survives being sent as a WhatsApp link.
 *
 * The measurements are real text rather than the supplier's chart image: a
 * table a screen reader can read, Google can index, and a phone can show
 * without pinching. Each table scrolls inside its own frame so a seven-column
 * chart never pushes the page sideways.
 */
export default function SizeGuide() {
  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">Size guide</p>
          <h1>Get the fit<br /><em>right first time.</em></h1>
          <p>
            Our kits are cut to an Asian sizing standard, so they run about a size small against
            what you would buy on a South African high street. Read the fit notes first, then check
            the measurements below against a shirt you already own.
          </p>
        </section>

        <section className="size-guide">
          <div className="size-guide__heading">
            <p className="section-index">How they fit</p>
            <h2>Start<br /><em>here.</em></h2>
          </div>
          <SizeGuideContent />
        </section>

        <section className="size-charts">
          <div className="size-charts__heading">
            <p className="section-index">Measurements</p>
            <h2>The actual<br /><em>numbers.</em></h2>
            <p>
              Every measurement is taken with the garment lying flat. <strong>Half chest</strong> is
              seam to seam across the chest — measure your own favourite shirt the same way and
              compare, rather than measuring around your body.
            </p>
          </div>

          {SIZE_CHARTS.map(chart => (
            <article key={chart.id} className="size-chart" id={`size-${chart.id}`}>
              <h3>{chart.title}</h3>
              <p className="size-chart__blurb">{chart.blurb}</p>
              <div className="size-chart__scroll">
                <table>
                  <caption className="sr-only">{chart.title} measurements in centimetres</caption>
                  <thead>
                    <tr>{chart.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {chart.rows.map(row => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {row.values.map((value, index) => <td key={`${row.label}-${index}`}>{value}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}

          <p className="size-charts__tolerance">{CHART_TOLERANCE}</p>

          <a className="size-guide__whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Send us your usual size and we will tell you which to take <span aria-hidden="true">&#8599;</span>
          </a>
        </section>

        <section className="instagram-section">
          <h2>Sure of<br /><em>your size?</em></h2>
          <Link href="/shop">Browse the archive <ArrowUpRight size={20} /></Link>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
