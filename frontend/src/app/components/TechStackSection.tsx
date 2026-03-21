import { Code2, Server, Database, Brain } from "lucide-react";

export function TechStackSection() {
  const technologies = [
    {
      icon: Code2,
      category: "Frontend",
      tech: "HTML, CSS, JavaScript (React)"
    },
    {
      icon: Server,
      category: "Backend",
      tech: "Python using FastAPI"
    },
    {
      icon: Database,
      category: "Database",
      tech: "MongoDB"
    },
    {
      icon: Brain,
      category: "AI/NLP",
      tech: "Machine Learning and Natural Language Processing models"
    }
  ];

  return (
    <section className="py-20 px-6 bg-[#1a2332]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 text-center tracking-tight">
          Technology Stack
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((item, index) => (
            <div 
              key={index}
              className="bg-[#0f1729] border border-slate-700 p-6 rounded-lg text-center"
            >
              <item.icon className="size-10 text-slate-400 mb-4 mx-auto" />
              <h3 className="text-sm mb-2 text-slate-500 uppercase tracking-wider">
                {item.category}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {item.tech}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
