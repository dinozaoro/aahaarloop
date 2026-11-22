import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { resolveAndroidDownloadUrl } from "@/lib/links";

export const metadata: Metadata = {
  title: "Good food deserves another destination",
  description:
    "Connect surplus food with the people and communities who need it. Every donation can make a difference.",
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    number: "01",
    title: "Share surplus",
    detail: "Restaurants and food businesses list food they cannot use before it goes to waste.",
    className: "step-preview-yellow",
    previewTitle: "New food listing",
    previewLabel: "Your kitchen · Your details",
    previewFood: "Surplus food ready to share",
    previewMeta: "Listing preview",
  },
  {
    number: "02",
    title: "Find a destination",
    detail: "NGOs, community kitchens and volunteers discover relevant food donations.",
    className: "step-preview-pink",
    previewTitle: "A good match, close by.",
    previewLabel: "Nearby community kitchen",
    previewFood: "A match for your portions",
    previewMeta: "Match preview",
  },
  {
    number: "03",
    title: "Deliver impact",
    detail: "Food is collected, delivered and tracked, creating measurable impact.",
    className: "step-preview-peach",
    previewTitle: "Food delivered. Loop complete.",
    previewLabel: "Listed · Collected · Shared",
    previewFood: "Handover confirmed.",
    previewMeta: "Delivery status",
  },
] as const;

function AndroidAction({ inverse = false }: { inverse?: boolean }) {
  const href = resolveAndroidDownloadUrl(process.env.NEXT_PUBLIC_ANDROID_APK_URL);
  const className = inverse
    ? "landing-button landing-button-dark"
    : "landing-button landing-button-primary";
  const label = "Download for Android";

  if (!href) {
    return (
      <span className={`${className} is-unavailable`} aria-disabled="true" title="Android download URL is not configured">
        {label}<ArrowDown aria-hidden="true" />
      </span>
    );
  }

  return <a className={className} href={href}>{label}<ArrowDown aria-hidden="true" /></a>;
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <section id="hero" className="landing-hero" aria-labelledby="hero-title">
        <p className="landing-eyebrow">A little less waste. A lot more possibility.</p>
        <h1 id="hero-title" className="landing-title">
          <span>Good food deserves</span>
          <em>another destination.</em>
        </h1>
        <p className="landing-intro">Connect surplus food with the people and communities who need it. Every donation can make a difference.</p>
        <div className="landing-actions">
          <AndroidAction />
          <Link className="landing-button landing-button-secondary" href="/browse">Explore Web App <ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <p className="landing-download-note">
          {process.env.NEXT_PUBLIC_ANDROID_APK_URL
            ? "Direct APK install · No Play Store needed"
            : "Direct APK download · URL pending"}
        </p>

        <figure className="food-story">
          <Image
            src="/images/indian-table-current.jpg"
            alt="A shared Indian meal, ready to find its next table"
            fill
            priority
            sizes="(max-width: 700px) calc(100vw - 40px), 92vw"
            className="food-story-image"
          />
          <span className="food-story-label">Made to be shared</span>
          <article className="floating-donation" aria-label="Donation preview">
            <span className="availability"><i /> Surplus available</span>
            <h2>A little extra. A lot of good.</h2>
            <p>Details set by the donor</p>
            <span className="collection-time">Collection time set by the donor <ArrowUpRight aria-hidden="true" /></span>
          </article>
          <article className="floating-delivery" aria-label="Delivery status preview">
            <span className="delivery-check"><Check aria-hidden="true" /></span>
            <span><strong>A better destination.</strong><small>Confirmed on handover</small></span>
          </article>
          <figcaption>Kitchen <ArrowRight aria-hidden="true" size={14} /> community</figcaption>
        </figure>
        <div className="image-caption"><span>Good food. New possibilities.</span><span>Donation journey / 01</span></div>
      </section>

      <div className="community-ribbon" aria-label="AahaarLoop community">
        <span>Made for Indian kitchens</span><i aria-hidden="true">+</i>
        <span>Powered by local communities</span><i aria-hidden="true">+</i>
        <span>Every portion matters</span><i aria-hidden="true">+</i>
        <span>Good food, full circle</span>
      </div>

      <section className="opportunity-section" aria-labelledby="opportunity-title">
        <div className="opportunity-image">
          <Image src="/images/sharing-a-meal.jpg" alt="Neighbours sharing a warm meal" fill sizes="(max-width: 760px) 100vw, 42vw" />
        </div>
        <div className="opportunity-copy">
          <p className="landing-eyebrow">01 / The opportunity</p>
          <h2 id="opportunity-title">Good food shouldn’t end up in the bin.</h2>
          <p>Sometimes, a kitchen makes more than it needs.</p>
          <p>Somewhere nearby, a meal can make a difference.</p>
          <p>The missing ingredient? A connection.</p>
          <blockquote><span>Not leftovers.</span><strong>A fresh possibility.</strong></blockquote>
        </div>
      </section>

      <section className="how-section" id="how-it-works" aria-labelledby="how-title">
        <div className="section-heading section-heading-split">
          <div><p className="landing-eyebrow">02 / How it works</p><h2 id="how-title">A small act. A full circle.</h2></div>
          <p>Three simple steps. Real-world impact.</p>
        </div>
        <ol className="steps-list">
          {STEPS.map((step) => (
            <li key={step.number}>
              <div className={`step-preview ${step.className}`}>
                <div className="step-preview-card">
                  <div className="step-preview-top"><span>{step.previewTitle}</span><span aria-hidden="true">+</span></div>
                  <span className="step-preview-label">{step.previewLabel}</span>
                  <strong>{step.previewFood}</strong>
                  <span className="step-preview-meta">{step.previewMeta}</span>
                </div>
              </div>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="community-section" id="community" aria-labelledby="community-title">
        <header className="community-heading">
          <div><p className="landing-eyebrow">03 / One loop. Many hands.</p><h2 id="community-title">Different roles. Shared purpose.</h2></div>
          <p>A place for everyone at the table.</p>
        </header>
        <div className="community-layout">
          <div className="community-photo">
            <Image src="/images/community-kitchen.jpg" alt="Kitchen volunteers sharing a moment" fill sizes="(max-width: 760px) 100vw, 42vw" />
          </div>
          <div className="ecosystem-roles">
            <Link href="/signin" className="ecosystem-role">
              <span className="step-number">01</span><span><strong>Food donors</strong><small>A little extra in your kitchen. A meaningful difference nearby.<em>Restaurants · Cafés · Caterers</em></small></span><ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/signin" className="ecosystem-role">
              <span className="step-number">02</span><span><strong>NGOs &amp; community kitchens</strong><small>Find food that fits your community, right when it’s needed.<em>Discover · Coordinate · Distribute</em></small></span><ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/signin" className="ecosystem-role">
              <span className="step-number">03</span><span><strong>Volunteers</strong><small>Be the connection between a generous kitchen and a fuller table.<em>Collect · Deliver · Make a difference</em></small></span><ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="impact-section" id="impact" aria-labelledby="impact-title">
        <div className="impact-heading">
          <div><p className="landing-eyebrow">04 / The difference we can make</p><h2 id="impact-title">Every portion adds up.</h2></div>
          <p>Impact is measured from confirmed handovers in the workspace — no sample figures here.</p>
        </div>
      </section>

      <section className="landing-cta" id="download" aria-labelledby="cta-title">
        <div><p className="landing-eyebrow">The next chapter starts with you</p><h2 id="cta-title">Good food.<br />Better together.</h2><p>Share a little. Change someone’s day.</p></div>
        <div className="landing-cta-actions">
          <AndroidAction inverse />
          <Link className="landing-button landing-button-light" href="/browse">Explore Web App <ArrowUpRight aria-hidden="true" /></Link>
          <span className="android-install-label">Android installation</span>
          <span className="android-install-note">QR placeholder · URL pending</span>
        </div>
      </section>
    </div>
  );
}
