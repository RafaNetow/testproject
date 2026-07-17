import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ProofStrip } from "@/components/proof-strip";
import { Services } from "@/components/services";
import { Approach } from "@/components/approach";
import { PullQuote } from "@/components/pull-quote";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Cursor } from "@/components/cursor";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <ProofStrip />
        <Services />
        <Approach />
        <PullQuote />
        <CaseStudies />
        <About />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
