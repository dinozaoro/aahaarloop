import { Logo } from "@/components/logo";
import Image from "next/image";
import Link from "next/link";

export function AccountLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="account-page">
      <header className="account-header">
        <Link href="/#hero" aria-label="AahaarLoop home">
          <Logo />
        </Link>
        <span>Bengaluru</span>
      </header>
      <div className="account-main">
        <section
          className="account-story"
          aria-label="A more generous everyday"
        >
          <p className="account-kicker">Good food, full circle</p>
          <h2>
            A little extra.
            <br />A better destination.
          </h2>
          <div className="account-photo">
            <Image
              src="/images/community-kitchen.jpg"
              alt="Community kitchen volunteers preparing a meal together"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 48vw"
            />
          </div>
          <p>
            Connect surplus food with nearby kitchens, shelters and volunteers.
          </p>
        </section>
        <section className="account-form-panel" aria-labelledby="account-title">
          <h1 id="account-title">{title}</h1>
          <p className="account-description">{description}</p>
          {children}
        </section>
      </div>
    </div>
  );
}
