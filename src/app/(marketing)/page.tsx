import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ProofStrip } from "@/components/proof-strip";
import { HowItWorks } from "@/components/how-it-works";
import { PullQuote } from "@/components/pull-quote";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <ProofStrip />
        <HowItWorks />
        <PullQuote />
        <CaseStudies />
        <About />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
