import { Shield, Upload, Brain, FileText, UserCheck } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Secure Authentication & Role-Based Access",
      description: "Enterprise-grade security with role-based permissions to control access to sensitive contract data."
    },
    {
      icon: Upload,
      title: "Contract Upload & Digital Management",
      description: "Seamlessly upload and organize your contracts in a centralized digital repository."
    },
    {
      icon: Brain,
      title: "AI-Powered Contract Analysis",
      description: "Advanced AI algorithms analyze contracts to identify key clauses, obligations, and potential risks."
    },
    {
      icon: FileText,
      title: "Intelligent Summarization",
      description: "Get clear, concise summaries of complex legal documents in plain language."
    },
    {
      icon: UserCheck,
      title: "Human-in-the-Loop Review",
      description: "Combine AI efficiency with human expertise to ensure accurate contract interpretation."
    }
  ];

  return (
    <section className="py-20 px-6 bg-[#1a2332]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 text-center tracking-tight">
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-[#0f1729] border border-slate-700 p-6 rounded-lg hover:border-slate-600 transition-colors"
            >
              <feature.icon className="size-10 text-slate-400 mb-4" />
              <h3 className="text-lg mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
