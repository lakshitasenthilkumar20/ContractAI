import { Sparkles } from "lucide-react";

export function SolutionSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Sparkles className="size-8 text-slate-400" />
          <h2 className="text-3xl md:text-4xl tracking-tight">
            Our Solution
          </h2>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
          Contract AI uses AI and NLP techniques to automatically analyze legal contracts, 
          extract key information, and generate simplified summaries. Our system combines 
          advanced machine learning with human oversight to ensure accuracy and reliability 
          in contract analysis.
        </p>
      </div>
    </section>
  );
}
