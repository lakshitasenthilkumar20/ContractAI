import { SharedHeader } from "../components/SharedHeader";
import { HeroSection } from "../components/HeroSection";
import { ProblemSection } from "../components/ProblemSection";
import { SolutionSection } from "../components/SolutionSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { HowItWorksSection } from "../components/HowItWorksSection";
import { TechStackSection } from "../components/TechStackSection";
import { TargetUsersSection } from "../components/TargetUsersSection";
import { CTASection } from "../components/CTASection";
import { Footer } from "../components/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1729] text-white font-inter">
      <SharedHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechStackSection />
        <TargetUsersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
