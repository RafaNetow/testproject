import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ProofStrip } from "@/components/proof-strip";
import { Services } from "@/components/services";
import { Approach } from "@/components/approach";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProofStrip />
        <Services />
        <Approach />
        <CaseStudies />
        <About />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
