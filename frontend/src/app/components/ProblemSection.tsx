import { AlertCircle, FileSearch, Users } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: FileSearch,
      text: "Manual contract review is time-consuming and complex"
    },
    {
      icon: AlertCircle,
      text: "Risk of missing critical clauses and legal obligations"
    },
    {
      icon: Users,
      text: "Difficulty for non-legal professionals to understand contract terms"
    }
  ];

  return (
    <section className="py-20 px-6 bg-[#1a2332]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 text-center tracking-tight">
          The Problem
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index} 
              className="bg-[#0f1729] border border-slate-700 p-6 rounded-lg"
            >
              <problem.icon className="size-10 text-slate-400 mb-4" />
              <p className="text-slate-300 leading-relaxed">
                {problem.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
