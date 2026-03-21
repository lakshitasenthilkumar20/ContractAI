import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#1a2332] to-[#0f1729]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-6 tracking-tight">
          Ready to analyze contracts smarter?
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
          Join Contract AI and transform how you review and understand legal documents.
        </p>
        <Button 
          size="lg"
          className="bg-slate-600 hover:bg-slate-500 text-white px-8 py-6 text-lg group"
          onClick={() => navigate("/login")}
        >
          Login to Contract AI
          <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
}