import { LogIn, Upload, Cpu, FileCheck, CheckCircle } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: LogIn,
      number: "01",
      title: "Login to the system",
      description: "Access the platform securely with your credentials"
    },
    {
      icon: Upload,
      number: "02",
      title: "Upload contract document",
      description: "Upload your contract files in various formats"
    },
    {
      icon: Cpu,
      number: "03",
      title: "AI analyzes the contract",
      description: "Our AI engine processes and analyzes the document"
    },
    {
      icon: FileCheck,
      number: "04",
      title: "Key clauses and summary generated",
      description: "Receive comprehensive analysis and simplified summaries"
    },
    {
      icon: CheckCircle,
      number: "05",
      title: "User reviews and makes decisions",
      description: "Review AI insights and take informed actions"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl mb-16 text-center tracking-tight">
          How It Works
        </h2>
        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="bg-[#1a2332] border border-slate-700 p-6 rounded-lg h-full flex flex-col">
                <div className="text-xs text-slate-500 mb-3 tracking-wider">
                  STEP {step.number}
                </div>
                <step.icon className="size-10 text-slate-400 mb-4 mx-auto" />
                <h3 className="text-sm mb-2 text-white">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-auto">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
