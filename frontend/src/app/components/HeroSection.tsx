import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl mb-6 tracking-tight">
          AI-Powered Contract Analysis <br />Made Simple
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Review, analyze, and manage legal contracts securely using artificial intelligence.
        </p>
        <Button 
          size="lg"
          className="bg-slate-600 hover:bg-slate-500 text-white px-8 py-6 text-lg"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>
    </section>
  );
}